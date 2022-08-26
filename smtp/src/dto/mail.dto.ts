export interface MailDto {
    from: string;
    to: string;
    user: string;
    subject: string | undefined;
    content: string | undefined;
}