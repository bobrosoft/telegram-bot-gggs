export interface VkPost {
  id: number;
  from_id: number;
  owner_id: number;
  date: number;
  marked_as_ads: boolean;
  post_type: 'post';
  text: string;
  is_pinned: boolean;
  attachments: VKAttachment[];
}

export type VKAttachment = {type: 'photo'; photo: VkPhoto} | {type: 'video'; video: VkVideo};

export interface VkPhoto {
  album_id: number;
  date: number;
  id: number;
  owner_id: number;
  access_key: string;
  post_id: number;
  sizes: Array<{
    type: 'm' | 'o' | 'p' | 'q' | 'r' | 's' | 'x';
    url: string;
    width: number;
    height: number;
  }>;
  text: string;
  user_id: number;
  has_tags: boolean;
}

export interface VkVideo {
  id: number;
  owner_id: number;
  text: string;
  user_id: number;
  image: Array<{
    url: string;
    width: number;
    height: number;
    with_padding: boolean;
  }>;
}
