/**
 * Thin email helper — uses Resend's REST API so no npm package is needed.
 *
 * Required env vars:
 *   RESEND_API_KEY      — from resend.com (free tier: 100 emails/day)
 *   RESEND_FROM_EMAIL   — verified sender, e.g. "FTUnfiltered <noreply@yourdomain.com>"
 *                         (during dev you can use "onboarding@resend.dev" for the free sandbox)
 *
 * If RESEND_API_KEY is not set the helpers are no-ops so nothing breaks in dev.
 */

const RESEND_API = "https://api.resend.com/emails";
const FROM =
  process.env.RESEND_FROM_EMAIL ?? "FTUnfiltered <onboarding@resend.dev>";

async function send(payload: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return; // email not configured — fail silently

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, ...payload }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] Resend error:", res.status, body);
    }
  } catch (err) {
    console.error("[email] Failed to send:", err);
  }
}

// ─── Templates ────────────────────────────────────────────────────────────────

/**
 * Notifies a user that they received a new anonymous letter.
 * Called after a letter is inserted with status = "delivered".
 */
export async function sendLetterNotification(recipientEmail: string): Promise<void> {
  const inboxUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ftunfiltered.com"}/inbox`;

  await send({
    to: recipientEmail,
    subject: "Someone wrote you an anonymous letter ✉",
    html: letterNotificationHtml(inboxUrl),
  });
}

// ─── HTML ─────────────────────────────────────────────────────────────────────

function letterNotificationHtml(inboxUrl: string): string {
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta name="color-scheme" content="light"/>
  <meta name="supported-color-schemes" content="light"/>
  <title>You have a new letter</title>
  <style>
    :root { color-scheme: light; }
    body  { margin:0; padding:0; background-color:#F0EAD8 !important; }
    a     { color:#FAF7F2; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F0EAD8;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background-color:#F0EAD8;padding:48px 16px;">
    <tr><td align="center" valign="top">

      <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0"
        style="max-width:520px;width:100%;">

        <!-- Tape strip -->
        <tr>
          <td align="center" style="padding-bottom:0;line-height:0;font-size:0;">
            <div style="display:inline-block;width:88px;height:22px;background-color:#CEBF9E;border-radius:1px;opacity:0.9;">&nbsp;</div>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background-color:#F6F3ED;border:1px solid #D8CCBC;border-radius:2px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="padding:12px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                  style="border:1px solid rgba(216,204,188,0.5);border-radius:1px;">
                  <tr><td style="padding:36px 40px 32px;">

                    <!-- Site name -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom:4px;">
                          <span style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#9E8E7A;">FTU</span>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom:28px;">
                          <span style="font-family:Georgia,'Times New Roman',serif;font-size:30px;color:#1A1512;letter-spacing:-0.02em;">unfiltered</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr><td style="border-top:1px dashed #D8CCBC;height:1px;line-height:1px;font-size:1px;">&nbsp;</td></tr>
                    </table>

                    <!-- Heading -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center" style="padding-bottom:8px;">
                          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1;">✉</p>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom:12px;">
                          <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:normal;color:#1A1512;line-height:1.4;">
                            Someone wrote you a letter.
                          </h1>
                        </td>
                      </tr>
                      <tr>
                        <td align="center" style="padding-bottom:32px;">
                          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;color:#9E8E7A;line-height:1.75;max-width:340px;">
                            An anonymous message is waiting for you in your inbox.
                            Only you can read it.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
                      <tr>
                        <td align="center">
                          <a href="${inboxUrl}"
                            style="display:inline-block;background-color:#8B4543;color:#FAF7F2 !important;font-family:Georgia,'Times New Roman',serif;font-size:14px;font-style:italic;letter-spacing:0.04em;text-decoration:none;padding:13px 40px;border-radius:2px;border:1px solid #7A3B39;">
                            Read my letter &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
                      <tr><td style="border-top:1px dashed #D8CCBC;height:1px;line-height:1px;font-size:1px;">&nbsp;</td></tr>
                    </table>

                    <!-- Unsubscribe note -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <p style="margin:0;font-family:Arial,sans-serif;font-size:11px;color:#B8A890;">
                            To stop receiving these emails, turn off letter notifications in your
                            <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://ftunfiltered.com"}/settings"
                              style="color:#9E8E7A;text-decoration:underline;">account settings</a>.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td></tr>
                </table>
              </td></tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding-top:20px;padding-bottom:6px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-style:italic;color:#B8A890;">
              The sender is anonymous — FTUnfiltered never reveals identities.
            </p>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom:8px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:10px;color:#C8BA9E;letter-spacing:0.12em;">
              &mdash; FTUnfiltered &middot; FTU anonymous board &mdash;
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>`;
}
