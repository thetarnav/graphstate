/**
 * '"' -> '\\"'
 * @param {string} str
 * @returns {string} */
function escape_quotes(str) {
	return str.replace(escape_quotes_regex, '\\"')
}
const escape_quotes_regex = /"/g

/** @typedef {string } String */
/** @typedef {string } ID */
/** @typedef {number } Int */
/** @typedef {number } Float */
/** @typedef {boolean} Boolean */

/**
 * @typedef  {object} GlobalLink
 * @property {ID} id
 * @property {String} title
 * @property {String} url
 * @property {String} year
 * @property {String} protocol
 * @property {String} description
 * @property {MainTopicWithTitleAndPrettyName} mainTopic
 */

/**
 * @typedef  {object} MainTopicWithTitleAndPrettyName
 * @property {String} name
 * @property {String} prettyName
 */

/**
 * @enum {(typeof learningStatus)[keyof typeof learningStatus]} */
export const learningStatus = /** @type {const} */({
	to_learn: "to_learn",
	learning: "learning",
	learned: "learned",
	none: "none",
})

/**
 * @enum {(typeof personalLinkAction)[keyof typeof personalLinkAction]} */
export const personalLinkAction = /** @type {const} */({
	removeProgress: "removeProgress",
	bookmark: "bookmark",
	inProgress: "inProgress",
	complete: "complete",
	like: "like",
	unlike: "unlike",
})

/**
 * @enum {(typeof linkState)[keyof typeof linkState]} */
export const linkState = /** @type {const} */({
	Bookmark: "Bookmark",
	InProgress: "InProgress",
	Completed: "Completed",
	None: "None",
})

/**
 * @typedef  {object} updateGrafbaseKvOutput
 * @property {String} name
 * @property {String} prettyName
 * @property {String} connections
 */

/**
 * @typedef  {object} section
 * @property {String} title
 * @property {String} summary
 * @property {ID} linkIds
 */

/**
 * @typedef  {object} PersonalLink
 * @property {ID} id
 * @property {String} title
 * @property {String} description
 * @property {MainTopicWithTitleAndPrettyName} mainTopic
 * @property {GlobalLink} globalLink
 */

/**
 * @typedef  {object} publicGetTopicsWithConnectionsOutput
 * @property {String} name
 * @property {String} prettyName
 * @property {String} connections
 */

/**
 * @typedef  {object} publicGetGlobalTopicsOutput
 * @property {String} prettyName
 * @property {String} name
 */

/**
 * @typedef  {object} publicGetPersonalTopicOutput
 * @property {String} prettyName
 * @property {String} content
 * @property {Boolean} public
 * @property {String} topicPath
 */

/**
 * @typedef  {object} publicGetGlobalTopicOutput
 * @property {String} prettyName
 * @property {String} topicSummary
 * @property {latestGlobalGuide} latestGlobalGuide
 * @property {GlobalLink} links
 * @property {Int} notesCount
 */

/**
 * @typedef  {object} getUserDetailsOutput
 * @property {Boolean} isMember
 */

/**
 * @typedef  {object} getPricingUserDetailsOutput
 * @property {String} stripePlan
 * @property {String} memberUntil
 * @property {Boolean} subscriptionStopped
 */

/**
 * @typedef  {object} globalNote
 * @property {String} content
 * @property {String} url
 */

/**
 * @typedef  {object} outputOfGetAllLinks
 * @property {PersonalLink} linksBookmarked
 * @property {PersonalLink} linksInProgress
 * @property {PersonalLink} linksCompleted
 * @property {PersonalLink} linksLiked
 */

/**
 * @typedef  {object} getTopicsLearnedOutput
 * @property {topicToLearn} topicsToLearn
 * @property {topicToLearn} topicsLearning
 * @property {topicToLearn} topicsLearned
 */

/**
 * @typedef  {object} publicGetGlobalLinkOutput
 * @property {String} title
 * @property {String} url
 * @property {Boolean} verified
 * @property {Boolean} public
 * @property {String} protocol
 * @property {String} fullUrl
 * @property {String} description
 * @property {String} urlTitle
 * @property {String} year
 */

/**
 * @typedef  {object} getGlobalTopicOutput
 * @property {String} learningStatus
 * @property {ID} linksBookmarkedIds
 * @property {ID} linksInProgressIds
 * @property {ID} linksCompletedIds
 * @property {ID} linksLikedIds
 */

/**
 * @typedef  {object} getGlobalLinksOutput
 * @property {ID} id
 * @property {String} title
 * @property {String} url
 */

/**
 * @typedef  {object} topicToLearn
 * @property {String} name
 * @property {String} prettyName
 * @property {Boolean} verified
 */

/**
 * @typedef  {object} globalGuideSection
 * @property {String} summary
 * @property {String} title
 * @property {GlobalLink} links
 */

/**
 * @typedef  {object} latestGlobalGuide
 * @property {globalGuideSection} sections
 */

/**
 * query publicGetTopicsWithConnections
 * @returns {publicGetTopicsWithConnectionsOutput} */
function publicGetTopicsWithConnections() {
	return 'query{publicGetTopicsWithConnections{name,prettyName,connections}}'
}

/**
 * query publicGetGlobalTopics
 * @returns {publicGetGlobalTopicsOutput} */
function publicGetGlobalTopics() {
	return 'query{publicGetGlobalTopics{prettyName,name}}'
}

/**
 * query publicGetPersonalTopic
 * @param   {String} topicName
 * @param   {String} user
 * @returns {publicGetPersonalTopicOutput} */
function publicGetPersonalTopic(topicName, user) {
	return 'query{publicGetPersonalTopic(topicName:"'+escape_quotes(topicName)+'",user:"'+escape_quotes(user)+'"){prettyName,content,public,topicPath}}'
}

/**
 * query publicGetGlobalTopic
 * @param   {String} topicName
 * @returns {publicGetGlobalTopicOutput} */
function publicGetGlobalTopic(topicName) {
	return 'query{publicGetGlobalTopic(topicName:"'+escape_quotes(topicName)+'"){prettyName,topicSummary,latestGlobalGuide,links,notesCount}}'
}

/**
 * query getUserDetails
 * @returns {getUserDetailsOutput} */
function getUserDetails() {
	return 'query{getUserDetails{isMember}}'
}

/**
 * query getPricingUserDetails
 * @returns {getPricingUserDetailsOutput} */
function getPricingUserDetails() {
	return 'query{getPricingUserDetails{stripePlan,memberUntil,subscriptionStopped}}'
}

/**
 * query getNotesForGlobalTopic
 * @param   {String} topicName
 * @returns {globalNote} */
function getNotesForGlobalTopic(topicName) {
	return 'query{getNotesForGlobalTopic(topicName:"'+escape_quotes(topicName)+'"){content,url}}'
}

/**
 * query getAllLinks
 * @returns {outputOfGetAllLinks} */
function getAllLinks() {
	return 'query{getAllLinks{linksBookmarked,linksInProgress,linksCompleted,linksLiked}}'
}

/**
 * query getTopicsLearned
 * @returns {getTopicsLearnedOutput} */
function getTopicsLearned() {
	return 'query{getTopicsLearned{topicsToLearn,topicsLearning,topicsLearned}}'
}

/**
 * query getGlobalLink
 * @param   {ID} linkId
 * @returns {publicGetGlobalLinkOutput} */
function getGlobalLink(linkId) {
	return 'query{getGlobalLink(linkId:"'+linkId+'"){title,url,verified,public,protocol,fullUrl,description,urlTitle,year}}'
}

/**
 * query getGlobalTopic
 * @param   {String} topicName
 * @returns {getGlobalTopicOutput} */
function getGlobalTopic(topicName) {
	return 'query{getGlobalTopic(topicName:"'+escape_quotes(topicName)+'"){learningStatus,linksBookmarkedIds,linksInProgressIds,linksCompletedIds,linksLikedIds}}'
}

/**
 * query getGlobalTopicLearningStatus
 * @param   {String} topicName
 * @returns {String} */
function getGlobalTopicLearningStatus(topicName) {
	return 'query{getGlobalTopicLearningStatus(topicName:"'+escape_quotes(topicName)+'")}'
}

/**
 * query getGlobalLinks
 * @returns {getGlobalLinksOutput} */
function getGlobalLinks() {
	return 'query{getGlobalLinks{id,title,url}}'
}

/**
 * query checkUrl
 * @param   {String} linkUrl
 * @returns {String} */
function checkUrl(linkUrl) {
	return 'query{checkUrl(linkUrl:"'+escape_quotes(linkUrl)+'")}'
}

/**
 * query getStripeDashboard
 * @returns {String} */
function getStripeDashboard() {
	return 'query{getStripeDashboard}'
}

/**
 * query stripe
 * @param   {String} plan
 * @param   {String} userEmail
 * @returns {String} */
function stripe(plan, userEmail) {
	return 'query{stripe(plan:"'+escape_quotes(plan)+'",userEmail:"'+escape_quotes(userEmail)+'")}'
}
