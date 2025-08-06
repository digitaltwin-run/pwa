#!/usr/bin/env node
/**
 * Script to check all HTML component modules for a <template id="..."> block.
 * Prints out any files missing the required template.
 */
const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../html-modules/components');

function checkTemplates() {
  const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.html'));
  let missing = [];
  for (const file of files) {
    const fullPath = path.join(componentsDir, file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    // The template id should match the file name (without extension) + '-template'
    const baseName = path.basename(file, '.html');
    const expectedId = `${baseName}-template`;
    const regex = new RegExp(`<template[^>]+id=["']${expectedId}["']`, 'i');
    if (!regex.test(content)) {
      missing.push({ file, expectedId });
    }
  }
  if (missing.length === 0) {
    console.log('All component HTML modules contain the required <template id="..."> block.');
  } else {
    console.warn('The following component files are missing the required <template id="..."> block:');
    missing.forEach(({ file, expectedId }) => {
      console.warn(`  - ${file} (expected <template id=\"${expectedId}\">)`);
    });
    process.exitCode = 1;
  }
}

checkTemplates();
