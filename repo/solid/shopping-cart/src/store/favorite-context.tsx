import { getStoreArray, updateStore, removeStore } from '@/helpers/storage';
import { createSignal, createContext, useContext } from 'solid-js';
import { ProductType } from '@/types/product.type';
import { ParentComponent } from 'solid-js';
import type { Accessor } from 'solid-js';

export type FavoriteStore = [
  Accessor<ProductType[]>,
  {
    favoritesLength: () => number;
    storedFavorites: (products: ProductType[]) => void;
    toggleFavorite: (product: ProductType) => void;
  }
];

const FavoritesContext = createContext<FavoriteStore>();

export const FavoritesProvider: ParentComponent<{}> = (props) => {
  const [favorites, setFavorites] = createSignal<ProductType[]>([]);

  const favoritesStore: FavoriteStore = [
    favorites,
    {
      favoritesLength() {
        return favorites().reduce(function (acc, item) {
          return acc + item.amount;
        }, 0);
      },
      storedFavorites(products: ProductType[]) {
        const favoriteStorage = getStoreArray('favorites');
        if (!favoriteStorage.length) return setFavorites([]);

        const favorites = favoriteStorage.map((item) => {
          const index = products.findIndex((product) => product.id === item);
          if (index !== -1) {
            return { ...products[index] };
          }
        });

        setFavorites(favorites as ProductType[]);
      },

      toggleFavorite(product: ProductType) {
        const existingFavoriteItem = favorites().find(
          (item) => item.name === product.name
        );
        const favoriteStorage = getStoreArray('favorites');
        if (!existingFavoriteItem) {
          updateStore('favorites', favoriteStorage, product.id);
          setFavorites([...favorites(), product]);
        } else {
          const storage = favoriteStorage.filter((item) => item !== product.id);
          storage.length
            ? updateStore(`favorites`, storage)
            : removeStore(`favorites`);
          setFavorites(
            favorites().filter((item) => item.name !== product.name)
          );
        }
      },
    },
  ];

  const rbBridge =
    typeof window === "undefined"
      ? undefined
      : (window as unknown as { __SC__?: { bindFavorites?: (api: any) => any } })
          .__SC__;
  if (rbBridge && rbBridge.bindFavorites) {
    rbBridge.bindFavorites({
      items: favorites,
      length: favoritesStore[1].favoritesLength,
    });
  }

  return (
    <FavoritesContext.Provider value={favoritesStore}>
      {props.children}
    </FavoritesContext.Provider>
  );
};

export function useFavorites() {
  return useContext(FavoritesContext);
}
