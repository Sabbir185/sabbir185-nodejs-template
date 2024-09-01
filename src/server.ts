/* eslint-disable no-console */
import app from "./app";
import { Config } from "./config";

const startServer = async () => {
    const PORT = Config.PORT;
    try {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

startServer();
