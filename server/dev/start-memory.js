'use strict';

// Starts the API with an ephemeral in-memory store so the app can be tried
// without installing MongoDB. Data is cleared whenever the process stops.
process.env.USE_IN_MEMORY_DB = 'true';

const app = require('../server');

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
    console.log(`weCare demo API listening on port ${port} (data is not persisted)`);
});
