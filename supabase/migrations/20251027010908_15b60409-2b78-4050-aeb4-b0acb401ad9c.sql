-- Update order_confirmed template to remove currency symbol
UPDATE notification_templates 
SET template = 'Hello {{name}}! Your order #{{order_number}} has been confirmed. Total: {{total}}. Thank you for shopping with us!'
WHERE name = 'order_confirmed';