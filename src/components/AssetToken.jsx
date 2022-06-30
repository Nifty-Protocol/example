import {
  Link,
  useParams,
} from 'react-router-dom';
import Nifty from 'nifty-protocol';

import { useContext, useEffect, useState } from 'react';
import { Web3Context } from '../web3';

let nifty;

const AssetToken = () => {
  const { contractAddress, chainId, nftId } = useParams();
  const { web3 } = useContext(Web3Context);

  const [nft, setNft] = useState({});
  const [nftData, setNftData] = useState({});
  const [userAvailableMethods, setUserAvailableMethods] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState(null);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    nifty = new Nifty({ key: 'test', env: Nifty.envs.TESTNET });

    nifty.getNFT(contractAddress, nftId, chainId)
      .then((res) => {
        setNft(res);
        nifty.getNFTData(res)
          .then((nftRes) => {
            setNftData(nftRes);
          });
      });
  }, []);

  useEffect(() => {
    if (!userAvailableMethods) {
      if (web3 && nftData) {
        nifty.initWallet(web3, Nifty.networkTypes.EVM);
        nifty.getUserAvailableMethods(nftData.listings, nft).then((res) => {
          setUserAvailableMethods(res);

          //  if user is owner of the NFT
          if (res.canSell) {
            const availableMethodsRes = nifty.getAvailablePaymentMethods(chainId);
            setPaymentMethods(availableMethodsRes);
          }
        })
          .catch((e) => {
            console.log('e', e);
          });
      }
    }
  }, [web3, nftData.listings]);

  const buy = async (nftToBuy, isExternalOrder) => {
    nifty.initWallet(web3, Nifty.networkTypes.EVM);
    nifty.setStatusListener((status) => console.log(status));

    // external orders can be looksrare / opensea / rarible
    const orderId = isExternalOrder ? nftToBuy.externalOrderId : nftToBuy.orderId;
    const listingRes = await nifty.getListing(orderId, isExternalOrder);

    try {
      const res = await nifty.buy(listingRes.data, isExternalOrder);
      console.log('res', res);
    } catch (e) {
      console.error('e', e);
    }
  };

  const sell = async (nftToSell) => {
    nifty.initWallet(web3, Nifty.networkTypes.EVM);
    nifty.setStatusListener((status) => console.log(status));

    const expirationTime = 86400; // in 1 day

    try {
      const res = await nifty.sell(nftToSell, price, expirationTime);
      console.log('res', res);
    } catch (e) {
      console.error('e', e);
    }
  };
  if (!nft) return <></>;

  return (
    <div>
      <img src={nft.preview} alt={nft.name} style={{ maxWidth: '300px', maxHeight: '300px' }} />
      <h1>{nft.contractName}</h1>
      <h2>{nft.name}</h2>

      {
        nft.price && (
          <h3>
            Price:
            {nft.price}
          </h3>
        )
      }

      {
        nft.externalOrderPrice && (
          <h3>
            External Order Price:
            {nft.externalOrderPrice}
          </h3>
        )
      }

      <h5>
        Description:
        {nft.description}
      </h5>

      <div>
        {userAvailableMethods?.canSell
          && (
            <>
              <input
                id="price"
                name="price"
                placeholder="price"
                form="nft price"
                style={{ height: '30px', width: '200px', marginRight: '10px' }}
                onChange={(e) => { setPrice(e.target.value); }}
              />

              {
                paymentMethods && (
                  <select
                    defaultValue={paymentMethods[0].value}
                    style={{ height: '30px', width: '200px', marginRight: '10px' }}
                  >
                    {paymentMethods.map((option) => (
                      <option key={option.key} value={option.value}>{option.value}</option>
                    ))}
                  </select>
                )
              }
              <button onClick={() => sell(nft)} type="button">List</button>
            </>
          )}

        {userAvailableMethods?.canBuy && <button onClick={() => buy(nft, false)} type="button">Buy</button>}
        {!!nft.externalOrderPrice && <button onClick={() => buy(nft, true)} type="button">External Buy</button>}
      </div>

      <div>
        {!!nft.attributes?.length && (
          <>
            <h2>Attributes:</h2>
            {
              nft.attributes.map((attribute) => (
                <div key={`${attribute.trait_type}_${attribute.value}`}>
                  {attribute.trait_type}
                  :
                  {attribute.value}
                </div>
              ))
            }
          </>
        )}
      </div>
    </div>
  );
};

export default AssetToken;
