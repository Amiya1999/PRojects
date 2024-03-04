const cors = require('cors');
module.exports = async (srv) => {
  // srv.before('/', (req) => {
  //   // Enable CORS for all routes
  //   req._.req.headers = req._.req.headers || {};
  //   req._.req.headers['access-control-allow-headers'] = '*';
  //   req._.req.headers['access-control-allow-methods'] = 'GET,HEAD,OPTIONS,PATCH,POST,PUT';
  //   req._.req.headers['access-control-allow-origin'] = '*';
  // });

  const db = await cds.connect.to({
    kind: 'postgres',
    credentials: {
      "host": "localhost", "port": 5432,
      "user": "postgres",
      "password": "Tathagat@231299",
      "database": "postgres",
      "schemas": "public"
    }
  });

  srv.on("CREATE", "coordinates", async (req) => {
    const { data } = req;

    console.log("coordinates", data);
    try {
      const query = `INSERT INTO map_coordinates
        (id,startpoint,endpoint)
        VALUES($1, $2, $3)
        RETURNING *`;

      const values = [data.id, data.startpoint, data.endpoint];
      const result = await db.run(query, values);
      return result;
    } catch (error) {
      console.error("Error creating city", error);
      throw error;
    }
  });

  srv.on('READ', 'coordinates', async (req) => {
    try {
      const result = await db.run(
        SELECT.from('map_coordinates')
      );
      return result;
    } catch (err) {
      console.error('Error reading coordinates:', err);
      throw err;
    }
  });

  srv.on('READ', 'getinfo', async (req) => {
    try {
      const result = await db.run(
        SELECT.from('map_pipeinfo')
      );
      return result;
    } catch (err) {
      console.error('Error reading pipe info:', err);
      throw err;
    }
  });

  srv.on('CREATE', 'getinfo', async (req) => {
    const { data } = req;
    try {
      const query = `INSERT INTO map_pipeinfo
        (id,length,coordinate_id)
        VALUES($1, $2, $3)
        RETURNING *`;
      const values = [data.id, data.length, data.coordinate_id];

      const result = await db.run(query, values);
      return result;
    } catch (err) {
      console.error('Error creating pipe info:', err);
      throw err;
    }
  });
};
