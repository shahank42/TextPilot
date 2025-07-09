# TextPilot

WhatsApp client with an AI Co-pilot!

<p align="center">
    <img src="https://raw.githubusercontent.com/shahank42/text-pilot/refs/heads/master/.github/text-pilot.png" border="0"></
</p>
<br />

## Features (still in development)

This application provides the following core functionalities:

- **QR Code Login**: Easily log in to your WhatsApp account by scanning a QR code, similar to WhatsApp Web.

- **Send and Receive Messages**: Send and receive text messages directly from the application.

- **Unread Message Indication**: Quickly identify unread conversations with a clear display of new messages.

- **Quote and Reply**: Quote specific messages and reply to them, maintaining conversational context.

# Installation and Usage

This project is designed as a self-hostable solution, allowing you to run it directly on your own machine. (I'm too poor to buy a server and host it, so this is the next best option :-P)

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Docker:** This project uses Docker Compose for easy setup and management.

## Quick Start

To get the application up and running, follow these steps:

1.  **Clone the Repository (if you haven't already):**

    ```bash
    git clone https://github.com/shahank42/TextPilot
    cd TextPilot
    ```

2.  **Start the Application:**

    Navigate to the root directory of the project in your terminal and run the following command:

    ```bash
    docker compose up -d --build
    ```

> [!NOTE]
> The initial build process may take some time (approximately 5 minutes on a fresh build) as it includes Puppeteer.

> [!IMPORTANT]
> This application utilizes ports `4173` and `3000`. Please ensure these ports are not in use by other applications on your system before starting the Docker containers.

## Accessing the Application

Once the Docker containers are up and running, you can access the application by opening your web browser and navigating to [http://localhost:4173/whatsapp](http://localhost:4173/whatsapp)

You should be presented with a QR code to link your WhatsApp account.

### Troubleshooting QR Code Scanning

If you encounter issues scanning the QR code with WhatsApp on your phone, try switching the website's theme to the light theme within the application. This often resolves scanning difficulties.

## Usage

After successfully scanning the QR code and waiting for the initial syncing process to complete, you will be directed to the chat screen. (For now it's just a QR code slapped on to the page, this flow needs to be enhanced later)

# Contributing

We welcome contributions to TextPilot! If you're interested in helping improve the project, please refer to our [CONTRIBUTING.md](https://github.com/shahank42/TextPilot/CONTRIBUTING.md) file for detailed guidelines on how to report bugs, suggest features, and submit pull requests.

# License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/shahank42/TextPilot/LICENSE) file for details.
