// Sidebar View
var SidebarView = Backbone.View.extend({
	el: '.sidebar',

	initialize: function () {
		$newGroupButton = $('<div class="group-add"><span>New Group</span></div>');

		this.listenTo(globalBookmarkCollections, 'add', this.loadBookmarkCollection);
		this.listenTo(globalBookmarkCollections, 'new', this.addButton);

		globalBookmarkCollections.fetch({ success: function() {
			this.$groupWrap = this.$('.group-wrap');

			// Check if there are any groups. If not, the 'new group' button must be appended.
			if ( this.$groupWrap.length == 0 ) {
				$newGroupButton.appendTo(this.$el); 
			}

			// After loading groups from the server insert the 'new group' button
			lastGroup = this.$groupWrap.last();
			$newGroupButton.insertAfter(lastGroup);
		}});


	},

	events: {
		'click .home-button': 'navHome',
		'click .group-add': 'createGroup'
	},
	
	// Get the last group, and append a 'new group' button after it.
	addButton: function() {
		lastGroup = $('.group-wrap').last();
		$newGroupButton.insertAfter(lastGroup);
		lastGroupName = $('.bookmarks-group-name').last();
		lastGroupName.empty().focus();
	},

	// Create new group.
	// Due to bug when saving new BookmarkCollection object, it's attributes are set manually.
	createGroup: function() {
		var newGroup = new BookmarkCollection();
		data = {title: 'Group', background: '#EB4040'};
		newGroup.url = 'api/collections/';
		newGroup.set(data);
		globalBookmarkCollections.add(newGroup);

		newGroup.save(data, { headers: { 'Authorization': 'Token ' + token }, success: function(){
			globalBookmarkCollections.trigger('new');
			newGroup.url = 'api/collections/' + newGroup.id;
		}});

		$('.group-add').remove();
	},

	// Back to home
	navHome: function() {
		pageRouter.navigate('', true);
	},

	loadBookmarkCollection: function(bookmarks_collection) {
		var newBookmarkCollectionView = new BookmarkCollectionView({model: bookmarks_collection});
		$(this.$el).append(newBookmarkCollectionView.el);
	}
});

var sidebar = new SidebarView();


var BookmarkCollectionView = Backbone.View.extend({
	tagName: 'div',
	className: 'group-wrap',
	model: BookmarkCollection,

	template: _.template($('#group-template').html()),

	initialize: function() {		
		
		// if you see bugs check the previous version of the constructor
		//
		this.listenTo(this.model.bookmarkCollections, 'add', this.render);

		this.listenTo(this.model, 'destroy', this.remove);


		// Load the subollection from the server
		this.model.bookmarkCollections.fetch();

	},

	events: {
		'click .bookmarks-group-nav': 'navigateRouter',
		'keypress .bookmarks-group-name': 'updateGroup',

		'dragenter': 'dragEnterEvent',
		'dragover': 'dragOverEvent',
		'dragleave': 'dragLeaveEvent',
		'drop': 'dragDropEvent',

		'click .bookmarks-group-delete': 'clear',

		'click .toggle-palette': 'togglePalette',
		'click .bookmarks-group-color': 'changeGroupColor'
	},

	navigateRouter: function() {

		pageRouter.navigate('#/collections/' + this.model.id, true);
	},

	serializeCollection: function() {
		this.model.bookmarkCollections.toJSON();
	},

	updateGroup: function(e) {
		if (e.which === ENTER_KEY) {
			this.$('.bookmarks-group-name').blur();
			var newval = this.$('.bookmarks-group-name').text();
			this.saveGroup(newval);
			return false;
		}
	},

	togglePalette: function() {
		this.$('.bookmarks-group-color-palette').toggleClass('drawer-open');
	},

	changeGroupColor: function(click) {

		var clickedElClass = click.target.classList[1];

		if (clickedElClass == 'palette-color-red') {
			newBgColor = '#EB4040';
		}

		if (clickedElClass == 'palette-color-green') {
			newBgColor = '#4ABB3E';
		}

		if (clickedElClass == 'palette-color-black') {
			newBgColor = '#343534';
		}

		if (clickedElClass == 'palette-color-lightblue') {
			newBgColor = '#33A3C0';
		}

		if (clickedElClass == 'palette-color-brown') {
			newBgColor = '#863825';
		}

		if (clickedElClass == 'palette-color-blue') {
			newBgColor = '#3E45BB';
		}

		if (clickedElClass == 'palette-color-orange') {
			newBgColor = '#eb6d20';
		}

		if (clickedElClass == 'palette-color-grey') {
			newBgColor = '#A3A3A3';
		}

		this.$el.css('background-color', newBgColor);
		this.model.save('background', newBgColor, { headers: { 'Authorization': 'Token ' + token } });
	},

	dragEnterEvent: function(e) {
		if (e.preventDefault) { e.preventDefault(); }
		this.$el.css('opacity','0.6');
	},

	dragOverEvent: function(e) {
		if (e.preventDefault) { e.preventDefault(); }
		return false;
	},

	dragDropEvent: function(e) {
		if (e.preventDefault) { e.preventDefault(); }

		data = JSON.parse(e.originalEvent.dataTransfer.getData('model'));

		var draggedModelCollectionID = data.collection_id;
		var draggedModel = bookmarks.get(data.id);

		var dropTarget = this.model.bookmarkCollections;
		var dropTargetID = this.model.id;

		if ( draggedModelCollectionID != null ) {
			var draggedModelCollection = globalBookmarkCollections.get(draggedModelCollectionID).bookmarkCollections;
			draggedModelCollection.remove(draggedModel);
			draggedModel.set({collection_id: dropTargetID})
			dropTarget.add(draggedModel);
			draggedModel.save({collection_id: dropTargetID}, { headers: { 'Authorization': 'Token ' + token } });
		} else {
			draggedModel.set({collection_id: dropTargetID})
			dropTarget.add(draggedModel);
			draggedModel.save({collection_id: dropTargetID}, { headers: { 'Authorization': 'Token ' + token } });
		}
		
		this.hideDragged(draggedModel);
		this.$el.css('opacity','1');
		return false;
	},

	dragLeaveEvent: function() {

		this.$el.css('opacity','1');
	},

	hideDragged: function(draggedModel) {

		draggedModel.trigger('dragHide');
	},

	saveGroup: function(newval) {
		this.model.save({ 'title': newval}, { headers: { 'Authorization': 'Token ' + token } });
	},

	// Deletes the model
	clear: function () {
		this.$el.css({
			right: '100%',
		}, this.$el.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', this.destrooy())
		)

	},

	destrooy: function() {
		this.model.destroy({ headers: { 'Authorization': 'Token ' + token } });
	},

	// The render function for the single collection.
	// It appends the template html and serialized model to the $el.
	render: function(bookmarks_collection) {
		this.$el.html(this.template(this.model.toJSON()));
		var background_color = this.model.get('background');
		this.$el.css('background-color', background_color);
		return this;
	}

});