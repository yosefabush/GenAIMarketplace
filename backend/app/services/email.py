"""Email service for sending notifications about recommendations."""

import logging
import smtplib
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import TYPE_CHECKING

from app.core.config import settings

if TYPE_CHECKING:
    from app.models import Recommendation, Item

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending email notifications related to recommendations."""

    @classmethod
    def _is_configured(cls) -> bool:
        """Check if SMTP is properly configured."""
        return bool(settings.SMTP_HOST and settings.SMTP_USER and settings.SMTP_PASSWORD)

    @classmethod
    def _send_email_async(cls, to_email: str, subject: str, html_body: str) -> None:
        """Send email in a background thread to avoid blocking the request."""
        thread = threading.Thread(
            target=cls._send_email_sync,
            args=(to_email, subject, html_body),
            daemon=True,
        )
        thread.start()

    @classmethod
    def _send_email_sync(cls, to_email: str, subject: str, html_body: str) -> None:
        """Send email synchronously. Called in background thread."""
        smtp_host = settings.SMTP_HOST
        smtp_user = settings.SMTP_USER
        smtp_password = settings.SMTP_PASSWORD

        if not smtp_host or not smtp_user or not smtp_password:
            # Log email instead of sending if SMTP not configured
            logger.info(
                f"Email notification (SMTP not configured):\n"
                f"  To: {to_email}\n"
                f"  Subject: {subject}\n"
                f"  Body:\n{html_body}"
            )
            return

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = to_email

            # Attach HTML content
            html_part = MIMEText(html_body, "html")
            msg.attach(html_part)

            # Send email
            with smtplib.SMTP(smtp_host, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())

            logger.info(f"Email sent successfully to {to_email}: {subject}")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")

    @classmethod
    def send_admin_notification(cls, recommendation: "Recommendation") -> None:
        """Send notification to admin when a new recommendation is submitted."""
        if not settings.ADMIN_EMAIL:
            logger.info(
                f"Admin notification skipped (ADMIN_EMAIL not configured): "
                f"New recommendation '{recommendation.title}' from {recommendation.submitter_email}"
            )
            return

        subject = f"[GenAI Marketplace] New Recommendation: {recommendation.title}"
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #4f46e5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
        .field {{ margin-bottom: 15px; }}
        .label {{ font-weight: bold; color: #6b7280; font-size: 14px; }}
        .value {{ margin-top: 5px; }}
        .type-badge {{ display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }}
        .type-agent {{ background: #dbeafe; color: #1e40af; }}
        .type-prompt {{ background: #dcfce7; color: #166534; }}
        .type-mcp {{ background: #fef3c7; color: #92400e; }}
        .type-workflow {{ background: #f3e8ff; color: #7c3aed; }}
        .type-docs {{ background: #e5e7eb; color: #374151; }}
        .cta {{ margin-top: 20px; text-align: center; }}
        .cta a {{ display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">New Item Recommendation</h2>
        </div>
        <div class="content">
            <div class="field">
                <div class="label">Title</div>
                <div class="value">{recommendation.title}</div>
            </div>
            <div class="field">
                <div class="label">Type</div>
                <div class="value">
                    <span class="type-badge type-{recommendation.type}">{recommendation.type.upper()}</span>
                </div>
            </div>
            <div class="field">
                <div class="label">Description</div>
                <div class="value">{recommendation.description}</div>
            </div>
            <div class="field">
                <div class="label">Reason for Recommendation</div>
                <div class="value">{recommendation.reason}</div>
            </div>
            <div class="field">
                <div class="label">Submitted By</div>
                <div class="value">{recommendation.submitter_email}</div>
            </div>
            <div class="field">
                <div class="label">Category</div>
                <div class="value">{recommendation.category.name if recommendation.category else 'None'}</div>
            </div>
            <div class="cta">
                <a href="#">Review Recommendation</a>
            </div>
        </div>
    </div>
</body>
</html>
"""
        cls._send_email_async(settings.ADMIN_EMAIL, subject, html_body)

    @classmethod
    def send_approval_notification(
        cls, recommendation: "Recommendation", item: "Item"
    ) -> None:
        """Send notification to submitter when their recommendation is approved."""
        subject = f"[GenAI Marketplace] Your Recommendation Was Approved: {recommendation.title}"
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #059669; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
        .message {{ margin-bottom: 20px; }}
        .field {{ margin-bottom: 15px; }}
        .label {{ font-weight: bold; color: #6b7280; font-size: 14px; }}
        .value {{ margin-top: 5px; }}
        .admin-notes {{ background: #fff; padding: 15px; border-left: 4px solid #059669; margin-top: 10px; }}
        .cta {{ margin-top: 20px; text-align: center; }}
        .cta a {{ display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">Recommendation Approved!</h2>
        </div>
        <div class="content">
            <div class="message">
                <p>Great news! Your recommendation has been approved and is now live in the GenAI Marketplace.</p>
            </div>
            <div class="field">
                <div class="label">Title</div>
                <div class="value">{item.title}</div>
            </div>
            <div class="field">
                <div class="label">Type</div>
                <div class="value">{item.type.upper()}</div>
            </div>
            {f'''
            <div class="field">
                <div class="label">Admin Notes</div>
                <div class="admin-notes">{recommendation.admin_notes}</div>
            </div>
            ''' if recommendation.admin_notes else ''}
            <div class="cta">
                <a href="#">View Your Item</a>
            </div>
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                Thank you for contributing to the GenAI Marketplace!
            </p>
        </div>
    </div>
</body>
</html>
"""
        cls._send_email_async(recommendation.submitter_email, subject, html_body)

    @classmethod
    def send_rejection_notification(cls, recommendation: "Recommendation") -> None:
        """Send notification to submitter when their recommendation is rejected."""
        subject = f"[GenAI Marketplace] Recommendation Update: {recommendation.title}"
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
        .message {{ margin-bottom: 20px; }}
        .field {{ margin-bottom: 15px; }}
        .label {{ font-weight: bold; color: #6b7280; font-size: 14px; }}
        .value {{ margin-top: 5px; }}
        .admin-notes {{ background: #fff; padding: 15px; border-left: 4px solid #dc2626; margin-top: 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0;">Recommendation Not Approved</h2>
        </div>
        <div class="content">
            <div class="message">
                <p>Thank you for your recommendation. After review, we've decided not to add this item to the marketplace at this time.</p>
            </div>
            <div class="field">
                <div class="label">Title</div>
                <div class="value">{recommendation.title}</div>
            </div>
            <div class="field">
                <div class="label">Reason</div>
                <div class="admin-notes">{recommendation.admin_notes or 'No additional details provided.'}</div>
            </div>
            <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                We appreciate your interest in contributing to the GenAI Marketplace. Feel free to submit other recommendations in the future!
            </p>
        </div>
    </div>
</body>
</html>
"""
        cls._send_email_async(recommendation.submitter_email, subject, html_body)
