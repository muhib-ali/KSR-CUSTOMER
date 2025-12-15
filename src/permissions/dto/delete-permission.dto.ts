import { IsUUID, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class DeletePermissionDto {
  @ApiProperty({
    description: "Permission ID to delete",
    example: "9eca588e-e8f9-4346-abea-f57e84d85069",
  })
  @IsUUID()
  @IsNotEmpty()
  id: string;
}
