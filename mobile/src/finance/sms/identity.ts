export function smsIdentity(sender: string, receivedAt: number, body: string): string {
  return `${sender}\n${receivedAt}\n${body}`;
}
