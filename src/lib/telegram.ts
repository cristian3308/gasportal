const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramMessage(message: string, parse_mode: 'MarkdownV2' | 'HTML' = 'HTML') {
  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    console.warn('Telegram Bot Token o Chat ID no configurados.');
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error de Telegram API:', error);
    }
  } catch (error) {
    console.error('Error enviando mensaje a Telegram:', error);
  }
}

/**
 * Formatea un mensaje de alerta de pago para Telegram con diseño "novedoso"
 */
export function formatPaymentAlert(payment: any) {
  return `
🔔 <b>ALERTA DE PAGO</b> 🔔
──────────────────
📌 <b>Asunto:</b> ${payment.title}
💰 <b>Monto:</b> $ ${parseFloat(payment.amount).toLocaleString()} COP
📅 <b>Vencimiento:</b> ${new Date(payment.dueDate).toLocaleDateString()}
📂 <b>Categoría:</b> ${payment.category}

⚠️ <i>Por favor revisa el portal para más detalles.</i>
  `;
}

/**
 * Formatea una alerta de inventario crítico
 */
export function formatInventoryAlert(type: 'TANK' | 'PRODUCT', item: any) {
  const icon = type === 'TANK' ? '⛽' : '🛢️';
  const name = type === 'TANK' ? item.fuelType : item.name;
  const level = type === 'TANK' ? `${item.currentLevel} Gal` : `${item.stock} Unidades`;

  return `
⚠️ <b>¡STOCK CRÍTICO!</b> ${icon}
──────────────────
📍 <b>Ítem:</b> ${name}
📉 <b>Estado Actual:</b> <b>${level}</b>
🚨 <b>Acción:</b> Se requiere reabastecimiento inmediato.
  `;
}
