import type { MapLocation } from '@/backend/mapLocations';

export const buildLocationPopup = (l: MapLocation, isRTL: boolean): string => {
  const name =
    (isRTL ? l.name_ar : l.name_en) ||
    (isRTL ? 'موقع بدون اسم' : 'Unnamed location');
  const address = isRTL ? l.address_ar : l.address_en;
  const addressFallback = isRTL ? 'لا يوجد عنوان متاح' : 'No address available';
  const phoneFallback = isRTL ? 'لا يوجد رقم هاتف' : 'No phone available';
  const emailFallback = isRTL ? 'لا يوجد بريد إلكتروني' : 'No email available';
  const waFallback = isRTL ? 'لا يوجد واتساب' : 'No WhatsApp available';
  const directions = isRTL ? 'الاتجاهات ↗' : 'Directions ↗';

  const labelCall = isRTL ? 'اتصل على' : 'Call';
  const labelEmail = isRTL ? 'أرسل بريدًا إلى' : 'Email';
  const labelWa = isRTL ? 'واتساب' : 'WhatsApp';
  const labelDir = isRTL ? 'افتح الاتجاهات إلى' : 'Open directions to';
  const dialogLabel = isRTL ? `تفاصيل الموقع: ${name}` : `Location details: ${name}`;

  const muted = 'color:#9ca3af;font-style:italic';
  const link =
    'color:#630d5f;text-decoration:none;outline-offset:2px;border-radius:2px';

  const phoneLine = l.phone
    ? `<a href="tel:${l.phone}" aria-label="${labelCall} ${l.phone}" style="${link}">${l.phone}</a>`
    : `<span style="${muted}">${phoneFallback}</span>`;

  const emailLine = l.email
    ? `<a href="mailto:${l.email}" aria-label="${labelEmail} ${l.email}" style="${link}">${l.email}</a>`
    : `<span style="${muted}">${emailFallback}</span>`;

  const waLine = l.whatsapp
    ? `<a href="https://wa.me/${l.whatsapp.replace(/\D/g, '')}" target="_blank" rel="noopener" aria-label="${labelWa} ${l.whatsapp}" style="${link}">${l.whatsapp}</a>`
    : `<span style="${muted}">${waFallback}</span>`;

  const addressLine = address
    ? `<div style="font-size:12px;color:#555;margin-bottom:6px">${address}</div>`
    : `<div style="font-size:12px;margin-bottom:6px;${muted}">${addressFallback}</div>`;

  const mapUrl = l.map_url || `https://www.google.com/maps?q=${l.latitude},${l.longitude}`;

  return `
    <div role="dialog" aria-label="${dialogLabel}" tabindex="-1" style="min-width:220px;font-family:inherit;line-height:1.6;outline:none">
      <div style="font-weight:700;font-size:14px;margin-bottom:4px">${name}</div>
      ${addressLine}
      <div style="font-size:12px"><span aria-hidden="true">📞</span> ${phoneLine}</div>
      <div style="font-size:12px"><span aria-hidden="true">✉️</span> ${emailLine}</div>
      <div style="font-size:12px"><span aria-hidden="true">💬</span> ${waLine}</div>
      <div style="font-size:12px;margin-top:6px">
        <a href="${mapUrl}" target="_blank" rel="noopener" aria-label="${labelDir} ${name}" style="${link};font-weight:600">${directions}</a>
      </div>
    </div>`;
};

export const getLocationTitle = (l: MapLocation, isRTL: boolean): string =>
  (isRTL ? l.name_ar : l.name_en) ||
  (isRTL ? 'موقع بدون اسم' : 'Unnamed location');
