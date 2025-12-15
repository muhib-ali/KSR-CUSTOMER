import { IsNotEmpty, IsString, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class DeleteRoleDto {
  @ApiProperty({
    description: "Role UUID to delete",
    example: "550e8400-e29b-41d4-a716-446655440000",
    format: "uuid",
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
