export function signupOtpEmail(code: string) {
  return {
    subject: `${code} is your The Off-Grid verification code`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="letter-spacing: 0.05em;">THE OFF-GRID</h2>
        <p>Enter this code to finish creating your account:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 0.1em;">${code}</p>
        <p style="color: #666; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  };
}
