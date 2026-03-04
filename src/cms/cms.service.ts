import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull, Not, In } from "typeorm";
import { HomeCmsSection } from "../entities/home-cms-section.entity";
import { CmsQueryDto } from "./dto/cms-query.dto";

export type CmsSectionWithSubsections = HomeCmsSection & {
  subsections: HomeCmsSection[];
};

const FILES_CMS_PATH = "/public/cms/";

@Injectable()
export class CmsService {
  private readonly filesBackendBaseUrl =
    process.env.FILES_BACKEND_URL || "http://localhost:3003";
  private readonly logger = new Logger(CmsService.name);

  constructor(
    @InjectRepository(HomeCmsSection)
    private readonly repo: Repository<HomeCmsSection>,
  ) {}

  /** Extract file name from URL if it points to our FILES backend /public/cms/ */
  // private getCmsFileNameFromUrl(url: string | null | undefined): string | null {
  //   if (!url || typeof url !== "string") return null;
  //   const base = this.filesBackendBaseUrl.replace(/\/$/, "");
  //   const prefix = `${base}${FILES_CMS_PATH}`;
  //   if (!url.startsWith(prefix)) return null;
  //   const rest = url.slice(prefix.length);
  //   const fileName = rest.split("?")[0].trim();
  //   if (!fileName || /[/\\]/.test(fileName)) return null;
  //   return fileName;
  // }

 
 
  async findAll(
    query: CmsQueryDto,
  ): Promise<{ rows: HomeCmsSection[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      search,
      sort_by = "sort_order",
      order = "ASC",
    } = query;

    const qb = this.repo
      .createQueryBuilder("s")
      .where("s.subsection_key IS NULL");

    if (search?.trim()) {
      qb.andWhere(
        "(s.section_key ILIKE :search OR s.label ILIKE :search OR s.title ILIKE :search)",
        { search: `%${search.trim()}%` },
      );
    }

    qb.orderBy(`s.${sort_by}`, order);

    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    if (rows.length > 0) {
      const sectionKeys = rows.map((r) => r.section_key);
      const subsectionsList = await this.repo.find({
        where: {
          section_key: In(sectionKeys),
          subsection_key: Not(IsNull()),
        },
        order: { sort_order: "ASC" },
      });
      const subsectionsBySection = new Map<string, HomeCmsSection[]>();
      for (const sub of subsectionsList) {
        const arr = subsectionsBySection.get(sub.section_key) ?? [];
        arr.push(sub);
        subsectionsBySection.set(sub.section_key, arr);
      }
      rows.forEach((r) => {
        const subsections = subsectionsBySection.get(r.section_key) ?? [];
        (r as any).subsections = subsections;
        (r as any).subsections_count = subsections.length;
      });
    }

    return { rows, total };
  }

  async findOne(id: string): Promise<CmsSectionWithSubsections> {
    const main = await this.repo.findOne({
      where: { id, subsection_key: IsNull() },
    });
    if (!main) {
      throw new NotFoundException(`CMS section with ID ${id} not found`);
    }

    const subsections = await this.repo.find({
      where: {
        section_key: main.section_key,
        subsection_key: Not(IsNull()),
      },
      order: { sort_order: "ASC" },
    });

    return { ...main, subsections };
  }


  

 
}
