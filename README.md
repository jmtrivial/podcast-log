# Outil de suivi d'écoutes de podcast

Outil développé pour mes besoins personnels, afin de suivre les écoutes d'un podcast que je réalise depuis quelques mois. On peut voir une [capture d'écran](screenshot.png) qui illustre le rendu.

## Limitations

L'outil suppose que chaque épisode contient dans son nom (et dans le nom du fichier mp3) une chaîne de la forme *SxxExx* (par exemple *S01E06* pour le sixième épisode de la première saison). La première saison doit commencer par le code *S01E00*. Il n'y a pour l'instant pas de prise en charge des saisons suivantes...

## Fonctionnement

Un script bash extrait du fichier log d'apache les entrées correspondant au podcast. Ce fichier est ensuite traité par une page web, en javascript, pour afficher des informations d'accès.

## Installation

Récupérer le dépôt courant, et installez-le sur le serveur.

## Configurer la partie shell

* copier le fichier ```bash/config.sample.sh``` en le renommant ```bash/config.sh```, puis renseignez les variables:
    * ```APACHE_LOG_FILE```: le fichier apache qui sera utilisé
    * ```FILTER```: le filtre utilisé pour ne sélectionner que les entrées correspondant à votre podcast (une chaîne de caractères toujours présente dans les noms des fichiers de ce podcast)
* ajouter une tâche cron pour répéter son exécution, par exemple: ```*/10 * * * * /path/to/this/repo/shell/update-logs.sh``` pour une récupération toutes les 10 minutes

## Configurer la partie web

* dans le répertoire ```web```, installer les dépendances à l'aide de la commande ```npm i```
* copier le fichier ```web/index.sample.html``` en ```web/index.html``` et le compléter suivant vos besoins.
* copier le fichier ```web/js/config.sample.js``` en le renommant ```web/js/config.js```, et renseigner les variables:
    * ```ip_to_remove```: un tableau défini comme une liste d'adresses ip (sous forme de chaîne de caractère) à filtrer (j'ai par exemple placé ici l'adresse IP de mon domicile, pour retirer toutes les connexions qui viennent de chez moi)
    * ```known_ips```: un tableau défini comme une liste d'adresses ip (sous forme de chaîne de caractère), qui seront identifiées par une étoile dans la liste des connexions (si on veut suivre des connexions en particulier)
    * ```rss```: l'adresse ```https``` du flux rss correspondant au podcast (pour l'affichage en haut de page)
    * ```start```: date du début du podcast
    * ```day```: numéro du jour de sortie hebdomadaire du podcast (0: dimanche, 1: lundi, ...)
    * ```nb_hours_list```: nombre d'heures considérées pour afficher les dernières écoutes.
* rendre accessible le répertoire ```web``` pour qu'il soit accessible par une url ```http``` ou ```https```.

## Remarque

Le fichier ```web/db/agents.json``` est issu du projet [prx-podagent](https://github.com/PRX/prx-podagent).
