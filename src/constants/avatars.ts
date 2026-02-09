export type AvatarGender = 'male' | 'female';

export interface AvatarConfig {
  id: string;
  gender: AvatarGender;
  path: string;
  alt: string;
}

const generateAvatars = (gender: AvatarGender): AvatarConfig[] =>
  Array.from({ length: 10 }, (_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return {
      id: `${gender}-${num}`,
      gender,
      path: `/assets/avatars/${gender}/${gender}-${num}.svg`,
      alt: `${gender.charAt(0).toUpperCase() + gender.slice(1)} Avatar ${i + 1}`,
    };
  });

const MALE_AVATARS = generateAvatars('male');
const FEMALE_AVATARS = generateAvatars('female');

export const AVATARS = {
  male: MALE_AVATARS,
  female: FEMALE_AVATARS,
};

export const ALL_AVATARS = [...MALE_AVATARS, ...FEMALE_AVATARS];

export const getAvatarPath = (avatarId: string): string => {
  const avatar = ALL_AVATARS.find(a => a.id === avatarId);
  return avatar?.path || MALE_AVATARS[0].path;
};

export const getRandomAvatar = (gender?: AvatarGender): string => {
  const genderPool = gender ? AVATARS[gender] : ALL_AVATARS;
  const randomIndex = Math.floor(Math.random() * genderPool.length);
  return genderPool[randomIndex].id;
};
