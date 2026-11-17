const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCwGHntZZ/44JsQ\n3TRGVZD4NpI7xkSISb/g2b01f7jHmu0Lio5VL7Bx4w69om3dbEN1dhEhu2lvnPBh\nr6kk8fMjT9mIBrAmc2KWUiE1TwVnHtSJZNo65OxAekHuQ1VzTuYvGrIlTsQR+Ovc\nsa3Pa6o3ElHswevYM3R7TpshRuiOqp1CGsXvR5Yc4IbHFR7XyvYoZQE1+RPc37mW\nMC/IWOkA+N4jB3yfKk0quvaVI5TZJmfdyCD2FI1onImVLObOfIvduisa0jAaBUm+\nrfbG3mRYdmRaWnlptcqxTnraOYJeJMNHnaBdSJvOOmMYEGw0YsP0LuesHTiMBNOm\nvn3jaPk7AgMBAAECggEARUv8fz1krI3Gt+Y0shDuEZ94AGnPgkpzZcqJuMngLzx6\nV/ZYeJFhwA94N4v57A60pT6nEz0rCq8ZsXds+or0AUtk8TCglSEHBNyhENdd6uyo\n+sBjWJXJmr4Bv/9jWxMLZjH9NM1AP0pTlu+c1Gkr/KwK7T6KzvPAvN18EqZS0gEO\nx+D92BilrV55fFCNjyW5cG1bV5rqY64nfaYUu0Rf77eeIMS9rAr6gE8PFbiM+huu\nqK4p9GzNdVJub/o2WFmSJ4tbEZpxNQivVLP1epnUlPjEhSWn3cplGOQ5fSXI23CP\nUHHdU3xpUo7UdhJjYzEaef1IHyZs3U82kfIG4U6NIQKBgQDd9BrgGt/uf4rjhdIM\n4Fq8XMmLkRLBZ2nVIU0lTOXVsvyewrCzsHK5YSp2Uoi32Z1cQwcPi2xNGBi6zgGa\njyg0k+fCGfgZUbvY7b1UCTaf2bRBNrx/4pL6Cn2Gsh+PBiVhTci9DyuFCI7j5mzc\nn9zEaZn3fmstE0MhJKLi0feM+QKBgQDLG5N8M+lBUE4BfNbk8ZbGF7HQ4J0qRWlk\nuf+Lq4B2yQ5vI1K7ByEg4yOYacILpTgUHiGBhMuwexR/C7GtYX8ofA3StY4+adlP\nLAfw4BYyNns1cbIijIiH/3wjsKzM9NbgNX852WwdRjHKOl2a/+bNlMnYLB8npS+k\nexL2LbgI0wKBgQCpFzcCVHcVM4WUIHcN6D44ElhZQ4SOY0J1ZJFpQVQ3ocxjBt+n\nhV1hbWz0B5yws9D2YPoYFZfEg/8TEa6XGUkABU4iybYBVAtQEI6UXxCGZ0y0AgdJ\nRkvCwgsverQgOgZwQtoTbmMxTnvNk9aLnh6KZAkwS9dK18nkjgyp0FxPwQKBgQCw\nSBnk1eVgY8OgdOrKwIg9HDmf8iNWmfIUk36hidOwxWY6vazDWTe+pIWzdi8ODnMy\nusgX8tsbLGgosEyhEBreV3Vj6WIw94u9tJibztJU+IZNZ4XViKXDa9Ih4+jG5sZM\nyQHIgtXcPp1eSPQPYIXA7p+VeQ39Sdik6JEXi6zMMwKBgHY/yJVAe+kZ3ReMxajY\njb6LHwL+uqlG7cU+3z7Wz0nVrDh44Y4R+SNOch9G+amG1q7hEAgciVFFx/KmWYxy\n+1k5PCF7OiMDB/sUsLZPUOHXlfShD4qGs7spy/J0cw3sZiRyEf1v/VoLmc21btA9\nQ3d/asmbk5AKVgObeqPrBXJC\n-----END PRIVATE KEY-----\n";
  const clientEmail = "metaleads1@techinpedia-sheets.iam.gserviceaccount.com";
  const calendarId = "techinpediaofficial@gmail.com";

  await prisma.setting.upsert({
    where: { key: 'google_client_email' },
    update: { value: clientEmail },
    create: { key: 'google_client_email', value: clientEmail, category: 'COMPANY' }
  });

  await prisma.setting.upsert({
    where: { key: 'google_private_key' },
    update: { value: privateKey },
    create: { key: 'google_private_key', value: privateKey, category: 'COMPANY' }
  });

  await prisma.setting.upsert({
    where: { key: 'google_calendar_id' },
    update: { value: calendarId },
    create: { key: 'google_calendar_id', value: calendarId, category: 'COMPANY' }
  });
}

main()
  .then(() => console.log('Successfully updated Google Credentials in DB'))
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
