import app from "./app";
import { Config } from "./config";
import logger from "./config/logger";

const startServer = async () => {
    const PORT = Config.PORT;
    try {
        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`);
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            logger.error(error.message);
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        }
    }
};

startServer();
