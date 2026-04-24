import * as neo4j from 'neo4j-driver';
import { faker } from '@faker-js/faker';

const URI = 'neo4j+s://2db88b14.databases.neo4j.io';
const USER = '2db88b14';
const PASSWORD = 'jE951Z6kRXceaWc0nlUQAyQMV2jAPS6gtwB6-diMKwo';

const driver = neo4j.driver(URI, neo4j.auth.basic(USER, PASSWORD));

async function seed() {
  const session = driver.session();
  console.log('Iniciando proceso de seeder...');

  try {
    console.log('Limpiando base de datos...');
    await session.run('MATCH (n) CALL { WITH n DETACH DELETE n } IN TRANSACTIONS OF 10000 ROWS');

    // 1. Crear Nodos
    console.log('Creando Categorías (50 nodos)...');
    const categories: string[] = [];
    for (let i = 0; i < 50; i++) { categories.push(faker.string.uuid()); }
    await session.run(`
      UNWIND $categories AS id
      CREATE (:Categoría {
        categoryId: id, nombre: 'Cat ' + id, nivel: 1, activa: true,
        keywords: ['k1', 'k2'], descripcion: 'Desc'
      })
    `, { categories });

    console.log('Creando Productos (1000 nodos)...');
    const products: string[] = [];
    for (let i = 0; i < 1000; i++) { products.push(faker.string.uuid()); }
    for (let i=0; i<products.length; i+=500) {
      await session.run(`
        UNWIND $batch AS id
        CREATE (:Producto {
          productId: id, nombre: 'Prod ' + id, precio: 100.0, enStock: true,
          tags: ['t1'], fechaAlta: datetime()
        })
      `, { batch: products.slice(i, i+500) });
    }

    console.log('Creando Usuarios (1000 nodos)...');
    const users: string[] = [];
    for (let i = 0; i < 1000; i++) { users.push(faker.string.uuid()); }
    for (let i=0; i<users.length; i+=500) {
      await session.run(`
        UNWIND $batch AS id
        CREATE (:Usuario {
          userId: id, nombre: 'User ' + id, email: id+'@test.com', activo: true,
          intereses: ['i1'], fechaRegistro: datetime()
        })
      `, { batch: users.slice(i, i+500) });
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
    for (let i=0; i<reviews.length; i+=500) {
      await session.run(`
        UNWIND $batch AS id
        CREATE (:Reseña {
          reviewId: id, puntuacion: 5, comentario: 'Genial', verificada: true,
          imagenes: [], fechaPublicacion: datetime()
        })
      `, { batch: reviews.slice(i, i+500) });
    }

    // 2. Crear Relaciones (Para evitar productos cartesianos lo hacemos emparejando arrays en JS)
    console.log('Creando Relaciones SUBCATEGORÍA_DE...');
    const catRels = categories.slice(1).map((id, i) => ({ child: id, parent: categories[0] }));
    await session.run(`
      UNWIND $rels AS r
      MATCH (child:Categoría {categoryId: r.child}), (parent:Categoría {categoryId: r.parent})
      CREATE (child)-[:SUBCATEGORÍA_DE {nivelJerarquia: 1, activa: true, fechaVinculo: datetime()}]->(parent)
    `, { rels: catRels });

    console.log('Creando Relaciones PERTENECE_A (Prod -> Cat)...');
    const prodCatRels = products.map(p => ({ p, c: faker.helpers.arrayElement(categories) }));
    for(let i=0; i<prodCatRels.length; i+=500) {
      await session.run(`
        UNWIND $rels AS r
        MATCH (prod:Producto {productId: r.p}), (cat:Categoría {categoryId: r.c})
        CREATE (prod)-[:PERTENECE_A {fechaAsignacion: datetime(), esPrincipal: true, orden: 1}]->(cat)
      `, { rels: prodCatRels.slice(i, i+500) });
    }

    console.log('Creando Relaciones COMPRÓ y VISTO (User -> Prod)...');
    const userProdRels = users.map(u => ({ u, p: faker.helpers.arrayElement(products) }));
    for(let i=0; i<userProdRels.length; i+=500) {
      await session.run(`
        UNWIND $rels AS r
        MATCH (u:Usuario {userId: r.u}), (p:Producto {productId: r.p})
        CREATE (u)-[:COMPRÓ {fechaCompra: datetime(), cantidad: 1, precioFinal: 100.0}]->(p)
        CREATE (u)-[:VISTO {fechaVista: datetime(), duracionSeg: 120, fuenteAcceso: 'App'}]->(p)
      `, { rels: userProdRels.slice(i, i+500) });
    }

    console.log('Creando Relaciones REALIZÓ y CONTIENE (User -> Orden -> Prod)...');
    const userOrderRels = orders.map((o, i) => ({ o, u: users[i % users.length], p: faker.helpers.arrayElement(products) }));
    for(let i=0; i<userOrderRels.length; i+=500) {
      await session.run(`
        UNWIND $rels AS r
        MATCH (u:Usuario {userId: r.u}), (o:Orden {orderId: r.o}), (p:Producto {productId: r.p})
        CREATE (u)-[:REALIZÓ {fechaOrden: datetime(), metodoPago: 'Card', descuento: 0.0}]->(o)
        CREATE (o)-[:CONTIENE {cantidad: 1, precioUnitario: 150.0, esGift: false}]->(p)
      `, { rels: userOrderRels.slice(i, i+500) });
    }

    console.log('Creando Relaciones SOBRE y CALIFICÓ (User -> Reseña -> Prod)...');
    const reviewRels = reviews.map((r, i) => ({ r, u: users[i % users.length], p: faker.helpers.arrayElement(products) }));
    for(let i=0; i<reviewRels.length; i+=500) {
      await session.run(`
        UNWIND $rels AS r
        MATCH (u:Usuario {userId: r.u}), (res:Reseña {reviewId: r.r}), (p:Producto {productId: r.p})
        CREATE (res)-[:SOBRE {aspectosEvaluados: ['General'], esVerificada: true, fechaRelacion: datetime()}]->(p)
        CREATE (u)-[:CALIFICÓ {fechaCalificacion: datetime(), util: true, plataforma: 'Web'}]->(res)
      `, { rels: reviewRels.slice(i, i+500) });
    }

    console.log('Creando Relaciones SIMILAR_A (Prod -> Prod) y RECOMENDADO_PARA (Prod -> User)...');
    const similarRels = products.slice(0, 500).map(p => ({ p1: p, p2: faker.helpers.arrayElement(products), u: faker.helpers.arrayElement(users) }));
    await session.run(`
      UNWIND $rels AS r
      MATCH (p1:Producto {productId: r.p1}), (p2:Producto {productId: r.p2}), (u:Usuario {userId: r.u})
      CREATE (p1)-[:SIMILAR_A {puntuacionSimilitud: 0.9, tipoSimilitud: 'ML', fechaCalculo: datetime()}]->(p2)
      CREATE (p1)-[:RECOMENDADO_PARA {scoreRecomendacion: 0.95, algoritmo: 'Collab', fechaRecomendacion: datetime()}]->(u)
    `, { rels: similarRels });

    const result = await session.run('MATCH (n) RETURN count(n) AS total');
    console.log('Seeder finalizado. Total de nodos en la BD:', result.records[0].get('total').toNumber());

  } catch (error) {
    console.error('Error durante el seeder:', error);
  } finally {
    await session.close();
    await driver.close();
  }
}

seed();
