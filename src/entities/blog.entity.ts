import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseAuditColumns } from './base-audit-columns.entity';

@Entity('blogs')
@Index(['created_at'])
@Index(['is_active'])
export class Blog extends BaseAuditColumns {
  @Column({ type: 'varchar', length: 255, nullable: false })
  heading: string;

  @Column({ type: 'text', nullable: false })
  paragraph: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  blog_img: string;
}
