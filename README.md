# Mini Projet INFO834
> Serveur de chat basé sur socket-io / mongodb / redis

Le mini projet est basé sur ce projet initialement : https://blog.bini.io/developper-une-application-avec-socket-io/


![](header.png)

## Installation

###Les packages
L'installation se fait dans deux repertoires.
Aller à la racine et executer :
```sh
npm install
```

Puis
```sh
cd socket.io-chat
npm intall
```
_Si des packets venait à manquer veuillez executer npm install *le nom du packet*_

###Replica Set
En suite il faut initialiser le replica set
Il faut commencer par créer les répertoires prévus pour accueillir les rs:
Aller dans votre repertoire "data" et executer :
```
mkdir rs1 rs2 rs3
```

```
mongod --replSet rs0 --port 27021 --dbpath /data/rs1/
mongod --replSet rs0 --port 27022 --dbpath /data/rs2/
mongod --replSet rs0 --port 27023 --dbpath /data/rs3/
mongod --replSet rs0 --port 30000 --dbpath /data/arb
```

Ensuite il faut spécifier le serveur Primary :
```
mongo --port 27018
rs.initiate()
```

Ajouter les deux serveurs Secondary au ReplicaSet :
```
rs.add("localhost:27019")
rs.add("localhost:27020")
```

Enfin définir l'arbitre avec la commande suivante :
```
rs.addArb("localhost:30000")
```

###Redis
Pour le serveur Redis il va vous falloir intsaller une verion de la 3.0 minimum pour des raisons de compatibiltées.
Que vous pourrez trouver à ce lien : https://github.com/MicrosoftArchive/redis/releases
Puis lancer le serveur Redis


## Utiliastion

Une fois l'installation terminé pour lancer l'application executer le fichier /socket.io-chat/server.js
Si tout fonctionne bien vous devriez arriver sur cette page 
![](https://www.zupimages.net/up/20/17/5et5.jpg)

Vous pourrez ensuite rentrer un nom et rejoindre le chat.
Sur le côté se trouve des salons que vous pouvez rejoindre en cliquant dessus pour discuter avec les utilisateur présents sur ces derniers.

![](https://www.zupimages.net/up/20/17/4nv1.jpg)

## Get clients avec Redis 

Pour cette partie on s'est basé sur le package socket.io-redis qui est un adaptateur. 
Le fonctionnement repose sur du pub/sub aussi.
Il y a d'ailleurs une fonction mis en commentaire dans le server.js pour pouvoir requêter une liste des personnes connecté avec le package :

```js
io.of('/').adapter.clients((err, clients) => {
  console.log(clients); // retournant un tableau des ids de tous les utilisateurs connectés
});
```
## Problèmes
Si vous rencontrez des soucis lors de l'installation merci de me conatacter.
Bonne expérience à tous !

## License

MPH
