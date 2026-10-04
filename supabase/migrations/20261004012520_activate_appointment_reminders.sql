-- Apply after process-reminders is available in production.
select cron.schedule('epew-appointment-reminders-every-minute','* * * * *',
 'select epew_private.trigger_appointment_reminders();');
