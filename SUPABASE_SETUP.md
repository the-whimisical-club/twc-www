# Supabase OTP Email Setup

This project uses OTP (One-Time Password) email authentication. To enable OTP codes instead of magic links, you need to configure the email template in your Supabase dashboard.

## Steps to Configure OTP Email Template

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Go to **Authentication** → **Email Templates**

2. **Modify the Magic Link Template**
   - Select the **Magic Link** template
   - Replace the content with:

```html
<h2>One time login code</h2>
<p>Please enter this code: {{ .Token }}</p>
<p>This code will expire in 1 hour.</p>
```

3. **Save the Template**
   - Click **Save** to apply changes

## Important Notes

- Email OTPs share an implementation with Magic Links in Supabase
- The `{{ .Token }}` variable displays the 8-digit OTP code
- By default, users can only request an OTP once every 60 seconds
- OTP codes expire after 1 hour (configurable in Auth > Providers > Email > Email OTP Expiration)
- Maximum expiry duration is 86400 seconds (one day) for security reasons

## Testing

After updating the template:
1. Go to `/signup` or `/login`
2. Enter your email address
3. Check your email - you should receive an 8-digit code instead of a magic link
4. Enter the code on the `/verify` page to complete authentication

