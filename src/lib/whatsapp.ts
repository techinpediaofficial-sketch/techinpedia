import { db } from './db';

export async function getWhatsAppNumber(): Promise<string> {
  try {
    const setting = await db.setting.findUnique({
      where: { key: 'whatsapp_number' },
    });
    if (setting?.value && setting.value.trim() !== '') {
      return setting.value.replace(/[^0-9]/g, '');
    }
  } catch {
    // Database query fallback
  }

  const envNum = process.env.WHATSAPP_NUMBER || '919876543210';
  return envNum.replace(/[^0-9]/g, '');
}

export function buildWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

export async function getGeneralWhatsAppLink(): Promise<string> {
  const number = await getWhatsAppNumber();
  const text = "Hi TechInPedia, I'd like to discuss a project. Could you share more details about your services?";
  return buildWhatsAppLink(number, text);
}

export async function getServiceWhatsAppLink(serviceTitle: string): Promise<string> {
  const number = await getWhatsAppNumber();
  const text = `Hi TechInPedia, I'm interested in your ${serviceTitle} service. I'd like to discuss my requirements with your team.`;
  return buildWhatsAppLink(number, text);
}

export async function getProjectWhatsAppLink(projectTitle: string): Promise<string> {
  const number = await getWhatsAppNumber();
  const text = `Hi TechInPedia, I saw your showcase for "${projectTitle}" and would like to discuss a similar solution.`;
  return buildWhatsAppLink(number, text);
}

export async function getLeadWhatsAppLink(clientName: string, service?: string): Promise<string> {
  const number = await getWhatsAppNumber();
  const text = `Hi TechInPedia, my name is ${clientName}${service ? ` and I am inquiring about ${service}` : ''}. I'd like to connect with your team.`;
  return buildWhatsAppLink(number, text);
}
