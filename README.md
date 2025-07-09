<h1 align="center">TextPilot</h1>

<p align="center">
    <img src="https://raw.githubusercontent.com/shahank42/text-pilot/refs/heads/master/.github/text-pilot.png" border="0"></
</p>

WhatsApp client with an AI Co-pilot!

## Features (still in development)

This application provides the following core functionalities:

- **QR Code Login**: Easily log in to your WhatsApp account by scanning a QR code, similar to WhatsApp Web.

- **Send and Receive Messages**: Send and receive text messages directly from the application.

- **Unread Message Indication**: Quickly identify unread conversations with a clear display of new messages.

- **Quote and Reply**: Quote specific messages and reply to them, maintaining conversational context.

# Installation and Usage

This project is designed as a self-hostable solution, allowing you to run it directly on your own machine. (I'm too poor to buy a server and host it, so this is the next best option :-P)

### Prerequisites

Ensure you have **Docker** installed, as this project uses Docker Compose.

### Quick Start

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/shahank42/TextPilot
    cd TextPilot
    ```

2.  **Start the application:**

    From the project's root directory, run:

    ```bash
    docker compose up -d --build
    ```

> [!NOTE]
> The initial build may take \~5 minutes due to Puppeteer.

> [!IMPORTANT]
> This application uses ports `4173` and `3000`. Ensure these ports are available.

### Accessing the Application

Once running, open your browser and go to [http://localhost:4173/whatsapp](https://www.google.com/search?q=http://localhost:4173/whatsapp). You'll see a QR code to link your WhatsApp account.

#### QR Code Troubleshooting

If you have trouble scanning the QR code, try switching the application's theme to light mode.

## Usage

After successfully scanning the QR code and waiting for the initial syncing process to complete, you'll be directed to the chat screen. (For now it's just a QR code slapped on to the page, this flow needs to be enhanced later)

# Contributors

<a href="https://github.com/shahank42/textpilot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=shahank42/textpilot" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

### Interested in Contributing?

We welcome contributions to TextPilot! If you're interested in helping improve the project, please refer to our [CONTRIBUTING.md](https://github.com/shahank42/TextPilot/CONTRIBUTING.md) file for detailed guidelines on how to report bugs, suggest features, and submit pull requests.

# Star History

[![Star History Chart](https://api.star-history.com/svg?repos=shahank42/textpilot&type=Date)](https://www.star-history.com/#shahank42/textpilot&Date)
