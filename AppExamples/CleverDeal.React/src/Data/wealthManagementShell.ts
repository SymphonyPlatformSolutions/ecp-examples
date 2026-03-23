import type { Contact } from '../Models/WealthManagementData';
import AmeliaChenProfile from '../Components/WealthManagement/assets/Amelia_Chen.png';
import EvelynReedProfile from '../Components/WealthManagement/assets/Evelyn_Reed.png';
import FayeZhangProfile from '../Components/WealthManagement/assets/Faye_Zhang.png';
import HansGruberProfile from '../Components/WealthManagement/assets/Hans_Gruber.png';
import JonathanSmithProfile from '../Components/WealthManagement/assets/Jonathan_Smith.png';
import RajPatelProfile from '../Components/WealthManagement/assets/Raj_Patel.png';

export type ShellContact = Pick<Contact, 'id' | 'name' | 'avatarUrl' | 'streamId'>;

export const wealthManagementShellData = {
  customer: {
    name: 'Hans Gruber',
    avatarUrl: HansGruberProfile,
  },
  wealthRoom: {
    'st3.dev.symphony.com': 'oCQx1R2K7mYcrI8z6/4NSX///nYr1OKEdA==',
    'corporate.symphony.com': 'ZFLJvom6ah5U0tr39vNGlX///nZE+r6KdA==',
    'preview.symphony.com': 'ZFLJvom6ah5U0tr39vNGlX///nZE+r6KdA==',
  },
  contacts: [
    {
      id: '1',
      name: 'Evelyn Reed',
      avatarUrl: EvelynReedProfile,
      streamId: 'Sc8n9Qgb7re0hAuOn7aWnX///mLo6093dA==',
    },
    {
      id: '2',
      name: 'Jonathan Smith',
      avatarUrl: JonathanSmithProfile,
      streamId: 'DToErkq9AAp8b9Psw6srMX///mLo7M1AdA==',
    },
    {
      id: '3',
      name: 'Amelia Chen',
      avatarUrl: AmeliaChenProfile,
      streamId: 'IG67/746izQS/AyMmE4Wz3///mLo6VsLdA==',
    },
    {
      id: '4',
      name: 'Raj Patel',
      avatarUrl: RajPatelProfile,
      streamId: 'irhBDGwEawNq/i1dDUzBMH///mLo6lA7dA==',
    },
    {
      id: '5',
      name: 'Faye Zhang',
      avatarUrl: FayeZhangProfile,
      streamId: 'Ze5LqRP0RgLww6lWUqBjIX///mL0CWI9dA==',
    },
  ] as ShellContact[],
};