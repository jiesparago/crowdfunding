import React,  { useContext, createContext} from 'react';

import { useAddress, useContract, useMetamask, useContractWrite, useContractRead, extractIPFSHashFromBytecode } from '@thirdweb-dev/react';
import { ethers } from 'ethers';
import { BigNumber } from 'ethers';
const StateContext = createContext();

export const StateContextProvider = ({ children }) =>{
    const { contract } = useContract('0x7084BF23160419cB2218fC3D1790cF94c93817AA');
    const { mutateAsync: createCampaign } = useContractWrite(contract, 'createCampaign');

    const address = useAddress();
    const connect = useMetamask();

    const publishCampaign = async (form) => {

      try {
        const target = BigNumber.from(form.target.toString());
        const deadline = BigNumber.from(new Date(form.deadline).getTime().toString());
    
        const data = await createCampaign({
          args: [
            address, // owner
            form.title, // title
            form.description, // description
            target,
            deadline, // deadline,
            form.image
          ]

        });
    
        console.log("contract call success", data)
      } catch (error) {
        console.log("contract call failure", error)
      }
    }

    const getCampaigns = async () =>{
      const campaigns = await contract.call('getCampaigns');
      console.log(campaigns)
      const parsedCampaigns = campaigns.map((campaign, i) =>({
        owner: campaign.owner,
        title: campaign.title,
        description:  campaign.description,
        target: ethers.utils.formatEther(campaign.target.toString()),
        deadline: campaign.deadline.toNumber(),
        amountCollected: ethers.utils.formatEther(campaign.amountCollected.toString()),
        image: campaign.image,
        pId: i
      }));

      return parsedCampaigns;
    }

    const getUserCampaigns = async () =>{
      const allCampaigns = await getCampaigns();

      const filteredCampaigns = allCampaigns.filter((campaign) => campaign.owner === address);

      return filteredCampaigns;
    }

    const donate = async (pId, amount) => {
      const data = await contract.call('donateToCampaign', pId.toString(), { value: ethers.utils.parseEther(amount)});
      return data;
    };
    

    const getDonations = async (pId) => {

      try {
        const donations = await contract.call("getDonators", pId);
        const numberOfDonations = donations[0].length;
    
        const parsedDonations = [];
    
        for (let i = 0; i < numberOfDonations; i++) {
          parsedDonations.push({
            donator: donations[0][i],
            donation: ethers.utils.formatEther(donations[1][i].toString()),
          });
        }
    
        return parsedDonations;
      } catch (error) {
        console.error("Error in getDonations:", error);
        return [];
      }
    };

    return (
        <StateContext.Provider
            value ={{
                address,
                contract,
                connect,
                createCampaign: publishCampaign,
                getCampaigns,
                getUserCampaigns,
                donate,
                getDonations,
            }}
        >
            {children}
        </StateContext.Provider>
    )
}

export const useStateContext  = () => useContext(StateContext)
