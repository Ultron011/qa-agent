#!/usr/bin/env node
import { Command } from 'commander';
import { join, resolve } from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import chalk from 'chalk';
import ora from 'ora';
import { crawl } from './crawler.js';
import { runAllSuites } from './tester.js';
import { analyzeFailures } from './analyzer.js';
import { renderReport, reportFilename } from './reporter.js';
import { applyAllFixes, fixBranchName } from './fixer.js';
import { ghAvailable, pushBranch, createPR, prTitle, prBody } from './github.js';
import { loadExpectations } from './expectations.js';

export type Reader = (q: string) => Promise<string>;

export async function promptYesNo(q: string, reader: Reader): Promise<boolean> {
  const ans = (await reader(`${q} [y/N]: `)).trim().toLowerCase();
  return ans === 'y' || ans === 'yes';
}

async function defaultReader(q: string): Promise<string> {
  const rl = createInterface({ input, output });
  try { return await rl.question(q); } finally { rl.close(); }
}

async function runTest(opts: { url: string; repo: string; expect?: string; depth: string }): Promise<void> {
  const when = new Date();
  const repoPath = resolve(opts.repo);
  const outputDir = process.cwd();
  const screenshotDir = join(outputDir, 'qa-screenshots');
  await mkdir(screenshotDir, { recursive: true });

  console.log(chalk.bold(`\nQA Agent — testing ${opts.url}\n`));

  const crawlSpinner = ora('Crawling site').start();
  const siteMap = await crawl({ rootUrl: opts.url, maxDepth: parseInt(opts.depth, 10) });
  crawlSpinner.succeed(`Crawled ${siteMap.pages.length} pages`);

  if (opts.expect) {
    const exps = await loadExpectations(opts.expect);
    console.log(chalk.dim(`Loaded ${exps.length} expectations from ${opts.expect}`));
  }

  const testSpinner = ora('Running test suites').start();
  const raw = await runAllSuites(siteMap, { screenshotDir });
  testSpinner.succeed(`${raw.failures.length} raw failures across ${siteMap.pages.length} pages`);

  const analyzeSpinner = ora('Analyzing failures via Claude').start();
  const bugs = await analyzeFailures(raw, repoPath);
  analyzeSpinner.succeed(`${bugs.bugs.length} bug(s) identified`);

  const reportMd = renderReport(siteMap, bugs, when);
  const reportPath = join(outputDir, reportFilename(when));
  await writeFile(reportPath, reportMd, 'utf8');
  console.log(chalk.green(`Report written: ${reportPath}`));

  if (bugs.bugs.length === 0) {
    console.log(chalk.green('No bugs found. Done.'));
    return;
  }

  const shouldFix = await promptYesNo(`Found ${bugs.bugs.length} bug(s). Generate fixes?`, defaultReader);
  if (!shouldFix) {
    console.log(chalk.yellow('Skipping fixes.'));
    return;
  }

  const fixSpinner = ora('Generating fixes via Claude').start();
  const results = await applyAllFixes(repoPath, bugs, when);
  const applied = results.filter((r) => r.applied).length;
  fixSpinner.succeed(`${applied}/${results.length} fix(es) applied`);

  if (applied === 0) {
    console.log(chalk.yellow('No fixes applied. Skipping PR.'));
    return;
  }

  if (!(await ghAvailable(repoPath))) {
    console.log(chalk.yellow('gh CLI not authenticated. Skipping PR creation.'));
    return;
  }

  const prSpinner = ora('Pushing branch and opening PR').start();
  const branch = fixBranchName(when);
  try {
    await pushBranch(repoPath, branch);
    const url = await createPR(repoPath, prTitle(when), prBody(reportMd, applied), branch);
    prSpinner.succeed(`PR opened: ${url}`);
  } catch (err) {
    prSpinner.fail(`PR creation failed: ${(err as Error).message}`);
  }
}

const program = new Command();
program.name('qa-agent').description('Autonomous QA testing agent').version('0.1.0');

program
  .command('test')
  .argument('<url>', 'URL of deployed site to test')
  .requiredOption('--repo <path>', 'Path to local repo for fixes')
  .option('--expect <file>', 'Path to expectations.md')
  .option('--depth <n>', 'Max crawl depth', '3')
  .action(async (url, options) => {
    try {
      await runTest({ url, repo: options.repo, expect: options.expect, depth: options.depth });
    } catch (err) {
      console.error(chalk.red(`Error: ${(err as Error).message}`));
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
