export interface ConnectionDto {
  /** ID des verbundenen Benutzers, für `removeConnection` */
  userId: string;
  userEmailAddress: string;
}