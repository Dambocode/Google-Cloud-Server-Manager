import logging
from logging.handlers import RotatingFileHandler


class Log:
    def __init__(self, app):
        self.app = app
        self.setup_logging()
        self.subscribers = set()
    
    def setup_logging(self):
        log_handler = RotatingFileHandler('your_log_file.log', maxBytes=10000, backupCount=1)
        log_handler.setLevel(logging.INFO)
        self.app.logger.addHandler(log_handler)
        
    def notify_subscribers(self, message):
        for sub in self.subscribers:
            sub.put(message)  # Assuming 'sub' is a queue-like object
    
    def log_and_notify(self, message):
        self.app.logger.info(message)  # Log to file
        self.notify_subscribers(message)  # Send to SSE subscribers
        print(message)
