import * as neo4j from 'neo4j-driver';
import { faker } from '@faker-js/faker';

const URI = 'neo4j+s://86e5d768.databases.neo4j.io';
const USER = '86e5d768';
const PASSWORD = 'Py71TNZ-59OuXDtE0Lup4rn4hWZd5oqXJSAHYyxQI78';

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

async function seed() {
  const session = driver.session();
  console.log('Iniciando proceso de seeder...');

  try {
    console.log('Limpiando base de datos...');
    await session.run('MATCH (n) CALL { WITH n DETACH DELETE n } IN TRANSACTIONS OF 10000 ROWS');

    // 1. CREAR NODOS
    console.log('Creando Categorías (50 nodos)...');
    const categories: string[] = [];
    for (let i = 0; i < 50; i++) { categories.push(faker.string.uuid()); }
    await session.run(`
      UNWIND $categories AS id
      CREATE (:Categoría {
        categoryId: id, nombre: 'Cat ' + left(id, 4), nivel: 1, activa: true,
        keywords: ['k1', 'k2'], descripcion: 'Desc'
      })
    `, { categories });

    console.log('Creando Productos (1000 nodos)...');
    const products: string[] = [];
    for (let i = 0; i < 1000; i++) { products.push(faker.string.uuid()); }

    const posiblesTags = ['Fotografía', 'Exposiciones de Arte', 'Gaming', 'Autos', 'Skateboarding', 'Tecnología', 'Música Urbana'];

    const productosConDetalles = products.map(id => ({
      id: id,
      nombre: faker.commerce.productName(),
      precio: parseFloat(faker.commerce.price({ min: 15, max: 1500 })),
      enStock: true,
      tagsAleatorios: faker.helpers.arrayElements(posiblesTags, faker.number.int({ min: 1, max: 3 }))
    }));

    for (let i=0; i<productosConDetalles.length; i+=500) {
      await session.run(`
        UNWIND $batch AS prod
        CREATE (:Producto {
          productId: prod.id, nombre: prod.nombre, precio: prod.precio,
          enStock: prod.enStock, tags: prod.tagsAleatorios, fechaAlta: datetime()
        })
      `, { batch: productosConDetalles.slice(i, i+500) });
    }

    console.log('Creando Usuarios (1000 nodos)...');
    const users: string[] = [];
    for (let i = 0; i < 1000; i++) { users.push(faker.string.uuid()); }

    const posiblesIntereses = ['Fotografía', 'Exposiciones de Arte', 'Videojuegos', 'Autos', 'Música Urbana', 'Tecnología', 'Moda', 'Skateboarding'];

    const usersConDetalles = users.map((id, index) => {
      // Cada usuario obtiene entre 1-4 intereses de la lista base
      const numIntereses = faker.number.int({ min: 1, max: 4 });
      const interesesAleatorios = faker.helpers.arrayElements(posiblesIntereses, numIntereses);
      
      // Agregar un interés único basado en el índice del usuario
      const interesUnico = `Interes-Custom-${index % 100}`;
      
      return {
        id: id,
        nombre: faker.person.fullName(),
        email: id + '@test.com',
        interesesAleatorios: [...interesesAleatorios, interesUnico]
      };
    });

    for (let i=0; i<usersConDetalles.length; i+=500) {
      await session.run(`
        UNWIND $batch AS user
        CREATE (:Usuario {
          userId: user.id, nombre: user.nombre, email: user.email, activo: true,
          intereses: user.interesesAleatorios, fechaRegistro: datetime()
        })
      `, { batch: usersConDetalles.slice(i, i+500) });
    }

    console.log('Creando Órdenes (1500 nodos)...');
    const orders: string[] = [];
    for (let i = 0; i < 1500; i++) { orders.push(faker.string.uuid()); }
    for (let i=0; i<orders.length; i+=500) {
      await session.run(`
        UNWIND $batch AS id
        CREATE (:Orden {
          orderId: id, total: 150.0, estado: 'Pendiente', urgente: false,
          productoIds: [], fechaCreacion: datetime()
        })
      `, { batch: orders.slice(i, i+500) });
    }

    console.log('Creando Reseñas (1450 nodos)...');
    const reviews: string[] = [];
    for (let i = 0; i < 1450; i++) { reviews.push(faker.string.uuid()); }

    const reviewsConDetalles = reviews.map(id => ({
      id: id,
      comentario: faker.lorem.words(3) + '!'
    }));

    for (let i=0; i<reviewsConDetalles.length; i+=500) {
      await session.run(`
        UNWIND $batch AS res
        CREATE (:Reseña {
          reviewId: res.id, puntuacion: 5, comentario: res.comentario,
          verificada: true, imagenes: [], fechaPublicacion: datetime()
        })
      `, { batch: reviewsConDetalles.slice(i, i+500) });
    }

    // 2. RELACIONES 

    console.log('Creando Relaciones SUBCATEGORÍA_DE...');
    const catRels = categories.slice(1).map(id => ({ child: id, parent: categories[0] }));
    await session.run(`
      UNWIND $rels AS r
      MATCH (child:Categoría {categoryId: r.child}), (parent:Categoría {categoryId: r.parent})
      CREATE (child)-[:SUBCATEGORÍA_DE {nivelJerarquia: 1, activa: true, fechaVinculo: datetime()}]->(parent)
    `, { rels: catRels });

    console.log('Creando Relaciones PERTENECE_A...');
    const prodCatRels = products.map(p => ({ p, c: faker.helpers.arrayElement(categories) }));
    for(let i=0; i<prodCatRels.length; i+=500) {
      await session.run(`
        UNWIND $rels AS r
        MATCH (prod:Producto {productId: r.p}), (cat:Categoría {categoryId: r.c})
        CREATE (prod)-[:PERTENECE_A {fechaAsignacion: datetime(), esPrincipal: true, orden: 1}]->(cat)
      `, { rels: prodCatRels.slice(i, i+500) });
    }

    // RELACIÓN USER-PRODUCTO 
    console.log('Creando Relaciones COMPRÓ y VISTO...');
    const userProdRels = users.map(u => ({
      u,
      p: faker.helpers.arrayElement(products)
    }));

    for(let i=0; i<userProdRels.length; i+=500) {
      await session.run(`
        UNWIND $rels AS r
        MATCH (u:Usuario {userId: r.u}), (p:Producto {productId: r.p})
        CREATE (u)-[:COMPRÓ {
          fechaCompra: datetime(),
          cantidad: 1,
          precioFinal: 100.0
        }]->(p)
        CREATE (u)-[:VISTO {
          fechaVista: datetime(),
          duracionSeg: 120,
          fuenteAcceso: 'App'
        }]->(p)
      `, { rels: userProdRels.slice(i, i+500) });
    }

    console.log('Creando Órdenes...');
    const userOrderRels = orders.map((o, i) => ({
      o,
      u: users[i % users.length],
      p: faker.helpers.arrayElement(products)
    }));

    for(let i=0; i<userOrderRels.length; i+=500) {
      await session.run(`
        UNWIND $rels AS r
        MATCH (u:Usuario {userId: r.u}), (o:Orden {orderId: r.o}), (p:Producto {productId: r.p})
        CREATE (u)-[:REALIZÓ {fechaOrden: datetime(), metodoPago: 'Card', descuento: 0.0}]->(o)
        CREATE (o)-[:CONTIENE {cantidad: 1, precioUnitario: 150.0, esGift: false}]->(p)
      `, { rels: userOrderRels.slice(i, i+500) });
    }

    console.log('Creando Reseñas...');
    const reviewRels = reviews.map((r, i) => ({
      r,
      u: users[i % users.length],
      p: faker.helpers.arrayElement(products)
    }));

    for(let i=0; i<reviewRels.length; i+=500) {
      await session.run(`
        UNWIND $rels AS r
        MATCH (u:Usuario {userId: r.u}), (res:Reseña {reviewId: r.r}), (p:Producto {productId: r.p})
        CREATE (res)-[:SOBRE {aspectosEvaluados: ['General'], esVerificada: true, fechaRelacion: datetime()}]->(p)
        CREATE (u)-[:CALIFICÓ {fechaCalificacion: datetime(), util: true, plataforma: 'Web'}]->(res)
      `, { rels: reviewRels.slice(i, i+500) });
    }

    console.log('Creando SIMILAR y RECOMENDACIONES...');
    const similarRels = products.slice(0, 500).map(p => ({
      p1: p,
      p2: faker.helpers.arrayElement(products),
      u: faker.helpers.arrayElement(users)
    }));

    await session.run(`
      UNWIND $rels AS r
      MATCH (p1:Producto {productId: r.p1}), (p2:Producto {productId: r.p2}), (u:Usuario {userId: r.u})
      CREATE (p1)-[:SIMILAR_A {puntuacionSimilitud: rand(), tipoSimilitud: 'ML', fechaCalculo: datetime()}]->(p2)
      CREATE (p1)-[:RECOMENDADO_PARA {scoreRecomendacion: rand(), algoritmo: 'Collab', fechaRecomendacion: datetime()}]->(u)
    `, { rels: similarRels });

    const result = await session.run('MATCH (n) RETURN count(n) AS total');
    console.log('Seeder finalizado. Total de nodos:', result.records[0].get('total').toNumber());

  } catch (error) {
    console.error('Error durante el seeder:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed(); 