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