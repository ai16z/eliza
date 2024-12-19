# Eliza

<img src="./docs/static/img/eliza_banner.jpg" alt="Eliza Banner" width="100%" />

## Fonctionnalités

-   🛠 Support des connecteurs Discord/ Twitter / Telegram
-   🔗 Support des différents modèles d'IA (Llama, Grok, OpenAI, Anthropic, etc.)
-   👥 Gestion de plusieurs agents et assistance
-   📚 Import et interactions avec différents types de documents simplifiés
-   💾 Accès aux données en mémoire et aux documents stockés
-   🚀 Grande personnalisation possible : création de nouveaux clients et de nouvelles actions
-   📦 Simplicité d'utilisation

Que pouvez-vous faire avec Eliza?

-   🤖 Chatbot
-   🕵 Agents autonomes
-   📈 Processus automatisés
-   🎮 PNJ interactifs
-   🧠 Trading automatisé

# Premiers pas

**Pré-requis (obligatoire) :**

-   [Python 2.7+](https://www.python.org/downloads/)
-   [Node.js 23+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
-   [pnpm](https://pnpm.io/installation)

> **Note pour Windows :** WSL est requis

### Editer le fichier .env

-   Copier le fichier d'exemple .env.example et le remplir avec les valeurs adéquates

```
cp .env.example .env
```

### Modifier les fichiers personnage

1. Ouvrir le document `src/core/defaultCharacter.ts` afin de modifier le personnage par défaut

2. Pour ajouter des personnages personnalisés :
    - Lancer la commande `pnpm start --characters="path/to/your/character.json"`
    - Plusieurs fichiers personnages peuvent être ajoutés en même temps

### Lancer Eliza

Après avoir terminé la configuration et les fichiers personnage, lancer le bot en tapant la ligne de commande suivante:

```bash
pnpm i
pnpm build
pnpm start

# Le projet étant régulièrement mis à jour, il vous faudra parfois le nettoyer avant de recommencer à travailler dessus
pnpm clean
```

#### Ressources additionnelles

Il vous faudra peut-être installer Sharp.
S'il y a une erreur lors du lancement du bot, essayez d'installer Sharp comme ceci :

```
pnpm install --include=optional sharp
```

### Communauté et réseaux sociaux

-   [GitHub](https://github.com/ai16z/eliza/issues). Pour partager les bugs découverts lors de l'utilisation d'Eliza, et proposer de nouvelles fonctionnalités.
-   [Discord](https://discord.gg/ai16z). Pour partager ses applications et rencontrer la communauté.

## Contributeurs

<a href="https://github.com/ai16z/eliza/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ai16z/eliza" />
</a>

## Historique d'étoiles

[![Star History Chart](https://api.star-history.com/svg?repos=ai16z/eliza&type=Date)](https://star-history.com/#ai16z/eliza&Date)
