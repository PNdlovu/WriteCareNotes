/**
 * @fileoverview Add File Headers Script
 * @module Scripts/AddFileHeaders
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * 
 * @description Automatically adds proper documentation headers to all service files.
 * Ensures consistent documentation across the entire codebase.
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface FileHeaderData {
  description: string;
  module: string;
  version: string;
  author: string;
  since: string;
  compliance: string;
  stability?: string;
}

/**
 * Generate file header template
 */
function generateHeader(data: FileHeaderData): string {
  return `/**
 * @fileoverview ${data.description}
 * @module ${data.module}
 * @version ${data.version}
 * @author ${data.author}
 * @since ${data.since}
 * @compliance ${data.compliance}
 ${data.stability ? `* @stability ${data.stability}` : ''}
 * 
 * @description ${data.description}
 */

`;
}

/**
 * Extract module name from file path
 */
function extractModuleName(filePath: string): string {
  const relativePath = path.relative(process.cwd(), filePath);
  const normalized = relativePath.replace(/\\/g, '/').replace('.ts', '');
  
  // Convert path to module name
  const parts = normalized.split('/');
  const moduleParts = parts
    .filter(p => !['src', 'services', 'controllers', 'middleware'].includes(p))
    .map(p => p.charAt(0).toUpperCase() + p.slice(1));
  
  return moduleParts.join('/');
}

/**
 * Infer file description from filename and content
 */
function inferDescription(filePath: string, content: string): string {
  const filename = path.basename(filePath, '.ts');
  
  // Check for existing description in old-style comments
  const existingDescMatch = content.match(/@description\s+(.+)/);
  if (existingDescMatch) {
    return existingDescMatch[1];
  }

  // Generate description from filename
  const words = filename
    .replace(/Service|Controller|Module|Middleware/g, '')
    .split(/(?=[A-Z])/)
    .map(w => w.toLowerCase());
  
  const type = filename.includes('Service') ? 'Service' :
               filename.includes('Controller') ? 'Controller' :
               filename.includes('Module') ? 'Module' :
               filename.includes('Middleware') ? 'Middleware' : '';
  
  return `${words.join(' ')} ${type}`.trim();
}

/**
 * Check if file already has proper header
 */
function hasProperHeader(content: string): boolean {
  return content.startsWith('/**') && 
         content.includes('@fileoverview') &&
         content.includes('@module') &&
         content.includes('@compliance');
}

/**
 * Remove old incomplete headers
 */
function removeOldHeaders(content: string): string {
  // Remove old TODO-style headers
  content = content.replace(/\/\*\*\s*\n\s*\*\s*TODO:\s*Add proper documentation\s*\n\s*\*\/\s*\n/gm, '');
  
  // Remove incomplete multi-line comments at the start
  const lines = content.split('\n');
  let startIndex = 0;
  
  if (lines[0].trim() === '/**') {
    for (let i = 1; i < Math.min(20, lines.length); i++) {
      if (lines[i].includes('*/')) {
        // Check if this is an incomplete header
        const headerContent = lines.slice(0, i + 1).join('\n');
        if (!headerContent.includes('@fileoverview') || 
            !headerContent.includes('@module') ||
            headerContent.includes('TODO')) {
          startIndex = i + 1;
        }
        break;
      }
    }
  }
  
  return lines.slice(startIndex).join('\n').trimStart();
}

/**
 * Process a single file
 */
async function processFile(filePath: string): Promise<void> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Skip if already has proper header
    if (hasProperHeader(content)) {
      console.log(`✓ Skipping ${filePath} (already has header)`);
      return;
    }

    // Remove old headers
    const cleanContent = removeOldHeaders(content);

    // Generate new header
    const headerData: FileHeaderData = {
      description: inferDescription(filePath, content),
      module: extractModuleName(filePath),
      version: '1.0.0',
      author: 'WriteCareNotes Team',
      since: new Date().toISOString().split('T')[0],
      compliance: 'CQC, Care Inspectorate, CIW, RQIA, GDPR',
      stability: 'stable'
    };

    const header = generateHeader(headerData);
    const newContent = header + cleanContent;

    // Write back to file
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✅ Added header to ${filePath}`);

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Adding file headers to service files...\n');

  const patterns = [
    'src/services/**/*Service.ts',
    'src/controllers/**/*Controller.ts',
    'src/middleware/**/*.ts',
    'src/modules/**/*.module.ts'
  ];

  let totalFiles = 0;
  let processedFiles = 0;

  for (const pattern of patterns) {
    const files = glob.sync(pattern, { 
      ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'] 
    });

    console.log(`\nProcessing pattern: ${pattern}`);
    console.log(`Found ${files.length} files\n`);

    for (const file of files) {
      await processFile(file);
      processedFiles++;
    }

    totalFiles += files.length;
  }

  console.log(`\n✅ Completed! Processed ${processedFiles}/${totalFiles} files`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { processFile, generateHeader, extractModuleName };
