import { Player, Power, Role, StateGame } from "database";
import prisma from "../../prisma";
import { deleteJob } from "../scheduler";

const startGame = async (gameId: number) => {
  prisma
    .$transaction(async transaction => {
      const game = await transaction.game.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          state: true,
          wolfProb: true,
          seerProb: true,
          insomProb: true,
          contProb: true,
          spiritProb: true,
          players: {
            select: {
              userId: true,
              gameId: true,
              state: true,
              role: true,
              power: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
      if (game === null) {
        return;
      }
      const players = game.players;
      const numWerewolves = Math.max(Math.ceil(game.wolfProb * players.length), 1);
      const werewolves: Player[] = [];
      // attribution des loups garous
      while (werewolves.length < numWerewolves) {
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        if (!werewolves.includes(randomPlayer)) {
          randomPlayer.role = Role.WOLF;
          werewolves.push(randomPlayer);
        }
      }
      // attribution des villageois
      players.forEach(player => {
        if (player.role !== Role.WOLF) {
          player.role = Role.VILLAGER;
        }
      });
      // attribution des pouvoirs
      if (Math.random() < game.seerProb) {
        const seer = players[Math.floor(Math.random() * players.length)];
        if (seer.power === Power.NONE) seer.power = Power.SEER;
      }
      let isSpirit = Math.random() < game.spiritProb;
      while (isSpirit) {
        const spirit = players[Math.floor(Math.random() * players.length)];
        if (spirit.power === Power.NONE) {
          spirit.power = Power.SPIRIT;
          isSpirit = false;
          await prisma.game.update({
            where: { id: gameId },
            data: {
              spiritChat: {
                create: {},
              },
            },
          });
        }
      }
      let isInsomniac = Math.random() < game.insomProb;
      while (isInsomniac) {
        const insomniac = players[Math.floor(Math.random() * players.length)];
        if (insomniac.role !== Role.WOLF && insomniac.power === Power.NONE) {
          insomniac.power = Power.INSOMNIAC;
          isInsomniac = false;
        }
      }
      let isContaminator = Math.random() < game.contProb;
      while (isContaminator) {
        const contaminator = players[Math.floor(Math.random() * players.length)];
        if (contaminator.role !== Role.VILLAGER && contaminator.power === Power.NONE) {
          contaminator.power = Power.CONTAMINATOR;
          isContaminator = false;
        }
      }

      const playersUpdate = players.map(player => {
        return transaction.player.update({
          where: { userId_gameId: { userId: player.userId, gameId: player.gameId } },
          data: player,
        });
      });
      await Promise.all(playersUpdate); // update all players concurrently
      await transaction.game.update({
        where: { id: gameId },
        data: {
          state: StateGame.DAY,
        },
      });
    })
    .then(() => {
      deleteJob(gameId);
      Promise.resolve();
    })
    .catch(error => {
      Promise.reject(error);
    });
};

export default startGame;