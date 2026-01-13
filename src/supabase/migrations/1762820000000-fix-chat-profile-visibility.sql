/* 
# Fix Profile Visibility for Chat Participants

1. **Problem**: 
   - Users (Parents/Orgs) could not see their conversation list populated because RLS policies on the `profiles` table prevented them from seeing the name/details of the person they were chatting with. 
   - `getConversations` query filters out results where the partner profile is null, leading to "empty inbox" even after sending messages.

2. **Solution**:
   - Add a specific RLS policy that allows any authenticated user to view the profile of another user *if* there is an existing chat message between them.
   - This ensures that once a conversation starts, both parties can resolve each other's identities in the inbox list.

3. **Security**:
   - Access is strictly scoped to people the user has actually interacted with.
*/

CREATE POLICY "Chat participants can view each other profiles" ON public.profiles
FOR SELECT TO authenticated USING (
  -- User can see themselves
  auth.uid() = id 
  OR
  -- User can see anyone they have exchanged a message with
  EXISTS (
    SELECT 1 FROM public.chat_messages_1762600000000 cm
    WHERE (cm.sender_id = auth.uid() AND cm.receiver_id = profiles.id)
       OR (cm.receiver_id = auth.uid() AND cm.sender_id = profiles.id)
  )
);