import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create blog_categories table
  await knex.schema.createTable('blog_categories', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable().unique();
    table.string('slug', 500).notNullable().unique();
    table.text('description').nullable();
    table.string('color', 255).nullable();
    table.integer('sortOrder').defaultTo(0);
    table.timestamps(true, true);
    
    table.index(['slug']);
    table.index(['sortOrder']);
  });

  // Create blog_tags table
  await knex.schema.createTable('blog_tags', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 255).notNullable().unique();
    table.string('slug', 500).notNullable().unique();
    table.string('color', 255).nullable();
    table.timestamps(true, true);
    
    table.index(['slug']);
    table.index(['name']);
  });

  // Create blog_posts table
  await knex.schema.createTable('blog_posts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('title', 255).notNullable();
    table.string('slug', 500).notNullable().unique();
    table.string('excerpt', 500).nullable();
    table.text('content').notNullable();
    table.string('featuredImage', 500).nullable();
    table.string('metaTitle', 255).nullable();
    table.string('metaDescription', 500).nullable();
    table.specificType('metaKeywords', 'text[]').nullable();
    table.enu('status', ['draft', 'published', 'archived']).defaultTo('draft');
    table.boolean('featured').defaultTo(false);
    table.integer('viewCount').defaultTo(0);
    table.integer('readTime').defaultTo(0);
    table.timestamp('publishedAt').nullable();
    table.string('authorName', 255).nullable();
    table.string('authorEmail', 255).nullable();
    table.timestamps(true, true);
    
    table.index(['slug']);
    table.index(['status']);
    table.index(['featured']);
    table.index(['publishedAt']);
    table.index(['viewCount']);
    table.index(['authorEmail']);
    table.index(['createdAt']);
  });

  // Create blog_comments table
  await knex.schema.createTable('blog_comments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.text('content').notNullable();
    table.string('authorName', 255).notNullable();
    table.string('authorEmail', 255).notNullable();
    table.string('authorWebsite', 255).nullable();
    table.boolean('approved').defaultTo(false);
    table.inet('ipAddress').nullable();
    table.uuid('postId').notNullable();
    table.timestamps(true, true);
    
    table.foreign('postId').references('id').inTable('blog_posts').onDelete('CASCADE');
    table.index(['postId']);
    table.index(['approved']);
    table.index(['createdAt']);
  });

  // Create blog_post_categories junction table
  await knex.schema.createTable('blog_post_categories', (table) => {
    table.uuid('post_id').notNullable();
    table.uuid('category_id').notNullable();
    table.primary(['post_id', 'category_id']);
    
    table.foreign('post_id').references('id').inTable('blog_posts').onDelete('CASCADE');
    table.foreign('category_id').references('id').inTable('blog_categories').onDelete('CASCADE');
  });

  // Create blog_post_tags junction table
  await knex.schema.createTable('blog_post_tags', (table) => {
    table.uuid('post_id').notNullable();
    table.uuid('tag_id').notNullable();
    table.primary(['post_id', 'tag_id']);
    
    table.foreign('post_id').references('id').inTable('blog_posts').onDelete('CASCADE');
    table.foreign('tag_id').references('id').inTable('blog_tags').onDelete('CASCADE');
  });

  // Add full-text search indexes for PostgreSQL
  await knex.raw(`
    CREATE INDEX CONCURRENTLY blog_posts_search_idx 
    ON blog_posts 
    USING gin(to_tsvector('english', title || ' ' || content || ' ' || COALESCE(excerpt, '')));
  `);

  // Add trigger to automatically update publishedAt when status changes to published
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_blog_post_published_at()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.status = 'published' AND OLD.status != 'published' AND NEW."publishedAt" IS NULL THEN
        NEW."publishedAt" = NOW();
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER blog_post_published_at_trigger
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_post_published_at();
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Drop triggers and functions
  await knex.raw('DROP TRIGGER IF EXISTS blog_post_published_at_trigger ON blog_posts;');
  await knex.raw('DROP FUNCTION IF EXISTS update_blog_post_published_at();');
  
  // Drop indexes
  await knex.raw('DROP INDEX CONCURRENTLY IF EXISTS blog_posts_search_idx;');
  
  // Drop tables in reverse order
  await knex.schema.dropTableIfExists('blog_post_tags');
  await knex.schema.dropTableIfExists('blog_post_categories');
  await knex.schema.dropTableIfExists('blog_comments');
  await knex.schema.dropTableIfExists('blog_posts');
  await knex.schema.dropTableIfExists('blog_tags');
  await knex.schema.dropTableIfExists('blog_categories');
}