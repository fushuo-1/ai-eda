import { z } from 'zod';

const schema = z.object({
  referenceDesignator: z.string(),
  searchMode: z.enum(['knn', 'radius', 'direction', 'collision']),
  k: z.number().int().min(1).max(100).optional(),
});

const testArgs = {
  referenceDesignator: 'C36',
  searchMode: 'knn',
  k: 5,
};

console.log('Test args:', JSON.stringify(testArgs, null, 2));
console.log('\nParsing schema...');

try {
  const result = schema.parse(testArgs);
  console.log('\n✅ Parse success:', result);
} catch (error) {
  console.log('\n❌ Parse error:', error);
}
