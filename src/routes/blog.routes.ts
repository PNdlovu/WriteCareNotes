import { EventEmitter2 } from "eventemitter2";

import { Router } from 'express';
import { BlogController } from '../controllers/blog/BlogController';

const router = Router();
const blogController = new BlogController(null as any); // Will be properly injected in NestJS

// Blog post routes
router.post('/posts', (req, res, next) => blogController.createPost(req.body).then(result => res.status(201).json(result)).catch(next));
router.get('/posts', (req, res, next) => blogController.findAllPosts(req.query as any).then(result => res.json(result)).catch(next));
router.get('/posts/popular', (req, res, next) => blogController.getPopularPosts(parseInt(req.query['limit'] as string)).then(result => res.json(result)).catch(next));
router.get('/posts/featured', (req, res, next) => blogController.getFeaturedPosts(parseInt(req.query['limit'] as string)).then(result => res.json(result)).catch(next));
router.get('/posts/recent', (req, res, next) => blogController.getRecentPosts(parseInt(req.query['limit'] as string)).then(result => res.json(result)).catch(next));
router.get('/posts/:slug', (req, res, next) => blogController.findPostBySlug(req.params['slug']).then(result => res.json(result)).catch(next));
router.get('/posts/:id/related', (req, res, next) => blogController.getRelatedPosts(req.params['id'], parseInt(req.query['limit'] as string)).then(result => res.json(result)).catch(next));
router.put('/posts/:id', (req, res, next) => blogController.updatePost(req.params['id'], req.body).then(result => res.json(result)).catch(next));
router.delete('/posts/:id', (req, res, next) => blogController.deletePost(req.params['id']).then(() => res.status(204).send()).catch(next));

// Category routes
router.post('/categories', (req, res, next) => blogController.createCategory(req.body).then(result => res.status(201).json(result)).catch(next));
router.get('/categories', (req, res, next) => blogController.findAllCategories().then(result => res.json(result)).catch(next));
router.get('/categories/:slug', (req, res, next) => blogController.findCategoryBySlug(req.params['slug']).then(result => res.json(result)).catch(next));
router.put('/categories/:id', (req, res, next) => blogController.updateCategory(req.params['id'], req.body).then(result => res.json(result)).catch(next));
router.delete('/categories/:id', (req, res, next) => blogController.deleteCategory(req.params['id']).then(() => res.status(204).send()).catch(next));

// Tag routes
router.get('/tags', (req, res, next) => blogController.findAllTags().then(result => res.json(result)).catch(next));
router.get('/tags/:slug', (req, res, next) => blogController.findTagBySlug(req.params['slug']).then(result => res.json(result)).catch(next));

// Comment routes
router.post('/comments', (req, res, next) => blogController.createComment(req.body, req).then(result => res.status(201).json(result)).catch(next));
router.put('/comments/:id/approve', (req, res, next) => blogController.approveComment(req.params['id']).then(result => res.json(result)).catch(next));
router.delete('/comments/:id', (req, res, next) => blogController.deleteComment(req.params['id']).then(() => res.status(204).send()).catch(next));

// SEO routes
router.get('/sitemap.xml', (req, res, next) => blogController.generateSitemap(res).catch(next));
router.get('/rss', (req, res, next) => blogController.generateRSSFeed(res).catch(next));
router.get('/search/suggestions', (req, res, next) => blogController.getSearchSuggestions(req.query['q'] as string).then(result => res.json(result)).catch(next));

export default router;