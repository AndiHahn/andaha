export interface ConnectionRequestDto {
  fromUserId: string;
  fromUserEmailAddress: string;
  targetUserId: string;
  targetUserEmailAddress: string;
  declined: boolean;
}
