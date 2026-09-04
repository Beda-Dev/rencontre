"use client";

// Centralized data-fetching hooks: every page reads/writes server state
// through these instead of hand-rolled useEffect+useState, so we get
// - caching + request de-duplication (two components asking for the same
//   thing at once share one fetch)
// - automatic background refetch on window focus / reconnect
// - explicit cache invalidation after each mutation, instead of components
//   guessing what to re-fetch
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import {
  BoostType,
  CascadeParams,
  Gif,
  MyProfile,
  Place,
  SearchParams,
  SpotifyTrack,
} from "./types";

export const queryKeys = {
  me: ["me"] as const,
  managedFields: ["managedFields"] as const,
  cascade: (params: CascadeParams) => ["cascade", params] as const,
  profile: (id: string) => ["profile", id] as const,
  conversations: ["conversations"] as const,
  messages: (id: string) => ["messages", id] as const,
  views: ["views"] as const,
  roam: ["roam"] as const,
  places: (query: string) => ["places", query] as const,
  neighborhood: (geohash: string) => ["neighborhood", geohash] as const,
  gifs: (query: string) => ["gifs", query] as const,
  discover: ["discover"] as const,
  topPicks: ["topPicks"] as const,
  alist: ["alist"] as const,
  vip: ["vip"] as const,
  rightNowFeed: ["rightNowFeed"] as const,
  rightNowMine: ["rightNowMine"] as const,
  boost: ["boost"] as const,
  tapStats: ["tapStats"] as const,
  spotify: (profileId: string) => ["spotify", profileId] as const,
  spotifyCatalog: ["spotifyCatalog"] as const,
  accounts: ["accounts"] as const,
  blockedProfiles: ["blockedProfiles"] as const,
  hiddenProfiles: ["hiddenProfiles"] as const,
  phrases: ["phrases"] as const,
  sharedMedia: (id: string) => ["sharedMedia", id] as const,
  travelPlan: ["travelPlan"] as const,
  legalAgreements: ["legalAgreements"] as const,
  search: (params: SearchParams) => ["search", params] as const,
};

export function useMeQuery() {
  return useQuery({ queryKey: queryKeys.me, queryFn: api.getMe });
}

export function useManagedFieldsQuery() {
  return useQuery({
    queryKey: queryKeys.managedFields,
    queryFn: api.getManagedFields,
    staleTime: Infinity, // managed fields barely ever change
  });
}

export function useCascadeQuery(params: CascadeParams) {
  return useQuery({
    queryKey: queryKeys.cascade(params),
    queryFn: () => api.getCascade(params),
  });
}

export function useProfileQuery(profileId: string) {
  return useQuery({
    queryKey: queryKeys.profile(profileId),
    queryFn: () => api.getProfile(profileId),
  });
}

export function useConversationsQuery() {
  return useQuery({
    queryKey: queryKeys.conversations,
    queryFn: api.getConversations,
    refetchInterval: 20_000, // light polling until we're fully on the WS layer
  });
}

export function useMessagesQuery(profileId: string) {
  return useQuery({
    queryKey: queryKeys.messages(profileId),
    queryFn: () => api.getMessages(profileId),
  });
}

export function useViewsQuery() {
  return useQuery({ queryKey: queryKeys.views, queryFn: api.getViews });
}

export function useUpdateMeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<MyProfile>) => api.updateMe(patch),
    onSuccess: (me) => qc.setQueryData(queryKeys.me, me),
  });
}

export function useToggleFavoriteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, favorite }: { profileId: string; favorite: boolean }) =>
      api.toggleFavorite(profileId, favorite),
    onSuccess: (_data, { profileId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(profileId) });
      qc.invalidateQueries({ queryKey: ["cascade"] });
    },
  });
}

export function useSetFavoriteNoteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, note }: { profileId: string; note: string }) =>
      api.setFavoriteNote(profileId, note),
    onSuccess: (_data, { profileId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(profileId) });
    },
  });
}

export function useBlockUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => api.blockUser(profileId),
    onSuccess: (_data, profileId) => {
      qc.removeQueries({ queryKey: queryKeys.profile(profileId) });
      qc.invalidateQueries({ queryKey: ["cascade"] });
      qc.invalidateQueries({ queryKey: queryKeys.conversations });
      qc.invalidateQueries({ queryKey: queryKeys.views });
    },
  });
}

export function useSendMessageMutation(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.sendMessage(profileId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.messages(profileId) });
      qc.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

export function useReactToMessageMutation(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string | null }) =>
      api.reactToMessage(profileId, messageId, emoji),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.messages(profileId) }),
  });
}

export function useUnsendMessageMutation(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => api.unsendMessage(profileId, messageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.messages(profileId) }),
  });
}

export function useSendTapMutation() {
  return useMutation({ mutationFn: (profileId: string) => api.sendTap(profileId) });
}

export function useRoamStatusQuery() {
  return useQuery({ queryKey: queryKeys.roam, queryFn: api.getRoamStatus });
}

export function usePlacesSearchQuery(query: string) {
  return useQuery({
    queryKey: queryKeys.places(query),
    queryFn: () => api.searchPlaces(query),
  });
}

export function useNeighborhoodQuery(geohash: string | null) {
  return useQuery({
    queryKey: queryKeys.neighborhood(geohash ?? ""),
    queryFn: () => api.getNeighborhood(geohash!),
    enabled: !!geohash,
  });
}

export function useSetRoamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (place: Place | null) => api.setRoam(place),
    onSuccess: (status) => {
      qc.setQueryData(queryKeys.roam, status);
      qc.invalidateQueries({ queryKey: ["cascade"] });
    },
  });
}

export function useUpdateLocationMutation() {
  return useMutation({ mutationFn: (geohash: string) => api.updateLocation(geohash) });
}

export function useGifsQuery(query: string) {
  return useQuery({
    queryKey: queryKeys.gifs(query),
    queryFn: () => (query ? api.searchGifs(query) : api.getTrendingGifs()),
  });
}

export function useUploadProfilePhotoMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.uploadProfilePhoto(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.me }),
  });
}

function useMessageMediaMutation<T extends unknown[]>(
  profileId: string,
  fn: (profileId: string, ...args: T) => Promise<unknown>
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: T) => fn(profileId, ...args),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.messages(profileId) });
      qc.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

export function useSendImageMessageMutation(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, expiring }: { file: File; expiring?: boolean }) =>
      api.sendImageMessage(profileId, file, expiring),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.messages(profileId) });
      qc.invalidateQueries({ queryKey: queryKeys.conversations });
    },
  });
}

export function useSendGifMessageMutation(profileId: string) {
  return useMessageMediaMutation<[Gif]>(profileId, api.sendGifMessage);
}

export function useSendAudioMessageMutation(profileId: string) {
  return useMessageMediaMutation<[Blob, number]>(profileId, api.sendAudioMessage);
}

export function useSendVideoMessageMutation(profileId: string) {
  return useMessageMediaMutation<[Blob, number]>(profileId, api.sendVideoMessage);
}

export function useDiscoverQuery() {
  return useQuery({ queryKey: queryKeys.discover, queryFn: api.getDiscoverSections });
}

export function useTopPicksQuery() {
  return useQuery({ queryKey: queryKeys.topPicks, queryFn: api.getTopPicks });
}

export function usePassTopPickMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => api.passTopPick(profileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.topPicks }),
  });
}

export function useAlistQuery() {
  return useQuery({ queryKey: queryKeys.alist, queryFn: api.getAlist });
}

export function useVipProfilesQuery() {
  return useQuery({ queryKey: queryKeys.vip, queryFn: api.getVipProfiles });
}

export function useRightNowFeedQuery() {
  return useQuery({ queryKey: queryKeys.rightNowFeed, queryFn: api.getRightNowFeed });
}

export function useActiveRightNowPostQuery() {
  return useQuery({
    queryKey: queryKeys.rightNowMine,
    queryFn: api.getActiveRightNowPost,
  });
}

export function useCreateRightNowPostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => api.createRightNowPost(text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rightNowMine });
      qc.invalidateQueries({ queryKey: queryKeys.rightNowFeed });
    },
  });
}

export function useDeleteRightNowPostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteRightNowPost(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.rightNowMine });
      qc.invalidateQueries({ queryKey: queryKeys.rightNowFeed });
    },
  });
}

export function useBoostStatusQuery() {
  return useQuery({ queryKey: queryKeys.boost, queryFn: api.getBoostStatus });
}

export function useStartBoostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (type: BoostType) => api.startBoost(type),
    onSuccess: (status) => qc.setQueryData(queryKeys.boost, status),
  });
}

export function useTapStatsQuery() {
  return useQuery({ queryKey: queryKeys.tapStats, queryFn: api.getTapStats });
}

export function useTranslateMessageMutation() {
  return useMutation({
    mutationFn: ({ body, targetLang }: { body: string; targetLang?: string }) =>
      api.translateMessage(body, targetLang),
  });
}

export function useSpotifyFavoritesQuery(profileId: string) {
  return useQuery({
    queryKey: queryKeys.spotify(profileId),
    queryFn: () => api.getSpotifyFavorites(profileId),
  });
}

export function useSpotifyCatalogQuery() {
  return useQuery({
    queryKey: queryKeys.spotifyCatalog,
    queryFn: api.getSpotifyCatalog,
  });
}

export function useSetSpotifyFavoritesMutation(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tracks: SpotifyTrack[]) => api.setSpotifyFavorites(tracks),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.spotify(profileId) }),
  });
}

export function useAccountsQuery() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: async () => api.getAccounts(),
  });
}

export function useSwitchAccountMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => api.switchAccount(profileId),
    onSuccess: () => {
      // Switching accounts means every cached query belongs to the wrong
      // user now — drop it all rather than invalidating piecemeal.
      qc.clear();
    },
  });
}

export function useRemoveAccountMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => api.removeAccount(profileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.accounts }),
  });
}

// ---- Messages/conversations management -----------------------------------

export function useMarkConversationReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => api.markConversationRead(profileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.conversations }),
  });
}

export function useBlockedProfilesQuery() {
  return useQuery({ queryKey: queryKeys.blockedProfiles, queryFn: api.getBlockedProfiles });
}

export function useUnblockUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => api.unblockUser(profileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.blockedProfiles });
      qc.invalidateQueries({ queryKey: ["cascade"] });
    },
  });
}

export function useReportProfileMutation() {
  return useMutation({
    mutationFn: ({ profileId, reason, comment }: { profileId: string; reason: number; comment: string }) =>
      api.reportProfile(profileId, reason, comment),
  });
}

export function useSetConversationMutedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, muted }: { profileId: string; muted: boolean }) =>
      api.setConversationMuted(profileId, muted),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.conversations }),
  });
}

export function useSetConversationPinnedMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ profileId, pinned }: { profileId: string; pinned: boolean }) =>
      api.setConversationPinned(profileId, pinned),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.conversations }),
  });
}

export function useDeleteConversationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => api.deleteConversation(profileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.conversations }),
  });
}

export function useDeleteMessageMutation(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => api.deleteMessage(profileId, messageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.messages(profileId) }),
  });
}

export function useMarkExpiringImageViewedMutation(profileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (messageId: string) =>
      api.markExpiringImageViewed(profileId, messageId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.messages(profileId) }),
  });
}

export function useSharedMediaQuery(profileId: string) {
  return useQuery({
    queryKey: queryKeys.sharedMedia(profileId),
    queryFn: () => api.getSharedMedia(profileId),
  });
}

export function usePhrasesQuery() {
  return useQuery({ queryKey: queryKeys.phrases, queryFn: api.getPhrases });
}

export function useAddPhraseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => api.addPhrase(text),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.phrases }),
  });
}

export function useDeletePhraseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePhrase(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.phrases }),
  });
}

// ---- Account & legal -------------------------------------------------------

export function useChangeEmailMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ newEmail, password }: { newEmail: string; password: string }) =>
      api.changeEmail(newEmail, password),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.me }),
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      api.changePassword(oldPassword, newPassword),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: (email: string) => api.forgotPassword(email) });
}

export function useDeleteAccountMutation() {
  return useMutation({ mutationFn: () => api.deleteAccount() });
}

export function useLegalAgreementsQuery() {
  return useQuery({ queryKey: queryKeys.legalAgreements, queryFn: api.getLegalAgreements });
}

export function useAcceptLegalAgreementsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.acceptLegalAgreements(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.legalAgreements }),
  });
}

// ---- Search & hide ----------------------------------------------------

export function useSearchQuery(params: SearchParams) {
  return useQuery({
    queryKey: queryKeys.search(params),
    queryFn: () => api.search(params),
    enabled: !!params.query || params.online != null,
  });
}

export function useHideProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => api.hideProfile(profileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.hiddenProfiles });
      qc.invalidateQueries({ queryKey: ["cascade"] });
    },
  });
}

export function useUnhideProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profileId: string) => api.unhideProfile(profileId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.hiddenProfiles }),
  });
}

export function useHiddenProfilesQuery() {
  return useQuery({ queryKey: queryKeys.hiddenProfiles, queryFn: api.getHiddenProfiles });
}

// ---- Travel plans -----------------------------------------------------

export function useTravelPlanQuery() {
  return useQuery({ queryKey: queryKeys.travelPlan, queryFn: api.getTravelPlan });
}

export function useSetTravelPlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      place,
      startDate,
      endDate,
      showOnProfile,
    }: {
      place: Place;
      startDate: number;
      endDate: number;
      showOnProfile: boolean;
    }) => api.setTravelPlan(place, startDate, endDate, showOnProfile),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.travelPlan }),
  });
}

export function useDeleteTravelPlanMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteTravelPlan(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.travelPlan }),
  });
}
