/**
 * @fileoverview blog.module
 * @module Modules/Blog.module
 * @version 1.0.0
 * @author WriteCareNotes Team
 * @since 2025-10-07
 * @compliance CQC, Care Inspectorate, CIW, RQIA, GDPR
 * @stability stable
 * 
 * @description blog.module
 */

import { EventEmitter2 } from "eventemitter2";

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPost, BlogCategory, BlogTag, BlogComment } from '../entities/blog/BlogPost';
import { BlogService } from '../services/blog/BlogService';
import { BlogController } from '../controllers/blog/BlogController';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BlogPost,
      BlogCategory,
      BlogTag,
      BlogComment
    ])
  ],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService]
})
export class BlogModule {}
