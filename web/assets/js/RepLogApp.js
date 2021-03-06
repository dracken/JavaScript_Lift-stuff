'use strict';

(function (window, $) {
    window.RepLogApp = function (wrapper) {

        this.wrapper = wrapper;
        this.helper = new Helper(this.wrapper);
        this.loadRepLogs();

        this.wrapper.on('click', '.js-delete-rep', this.handleRepLogDelete.bind(this));
        this.wrapper.on('click', 'tbody tr', this.handleRowClick.bind(this));
        this.wrapper.on('submit', this._selectors.newRepForm, this.handleNewFormSubmit.bind(this));
    };

    $.extend(window.RepLogApp.prototype, {
        _selectors: {
            newRepForm: '.js-new-rep-log-form'
        },

        updateTotalWeightLifted: function () {
            this.wrapper.find('.js-total-weight').html(
                this.helper.calculateTotalWeight()
            );
        },

        handleRepLogDelete: function (e) {
            e.preventDefault();

            let link = $(e.currentTarget);
            link.addClass('text-danger');
            link.find('.fa')
                .removeClass('fa-trash')
                .addClass('fa-spinner')
                .addClass('fa-spin');

            let deleteUrl = link.data('url');
            let row = link.closest('tr');
            let self = this;
            $.ajax({
                url: deleteUrl,
                method: 'DELETE',
                success: function () {
                    row.fadeOut('normal', function () {
                        $(this).remove();
                        self.updateTotalWeightLifted();
                    });
                }
            });
        },

        handleRowClick: function () {
            console.log('row clicked');
        },

        handleNewFormSubmit: function (e) {
            e.preventDefault();

            let form = $(e.currentTarget);
            let formData = {};
            $.each(form.serializeArray(), function (key, fieldData) {
                formData[fieldData.name] = fieldData.value
            });
            let self = this;

            $.ajax({
                url: form.data('url'),
                method: 'POST',
                data: JSON.stringify(formData),
                success: function (data) {
                    self._clearForm();
                    self._addRow(data);
                },
                error: function (jqXHR) {
                    let errorData = JSON.parse(jqXHR.responseText);
                    self._mapErrorsToForm(errorData.errors);
                }
            });
        },

        _mapErrorsToForm: function (errorData) {
            this._removeFormErrors();
            let form = this.wrapper.find(this._selectors.newRepForm);

            form.find(':input').each(function () {
                let fieldName = $(this).attr('name');
                let wrapper = $(this).closest('.form-group');
                if (!errorData[fieldName]) {
                    // continue;
                }

                let error = $('<span class="js-field-error help-block"></span>');
                error.html(errorData[fieldName]);
                wrapper.append(error);
                wrapper.addClass('has-error');

            });
        },

        _removeFormErrors: function () {
            let form = this.wrapper.find(this._selectors.newRepForm);
            form.find('.js-field-error').remove();
            form.find('.form-group').removeClass('has-error');
        },

        _clearForm: function () {
            this._removeFormErrors();
            let $form = this.wrapper.find(this._selectors.newRepForm);
            $form[0].reset();
        },
        
        _addRow: function (repLog) {
            let tplText = $('#js-rep-log-row-template').html();
            let tpl = _.template(tplText);
            let html = tpl(repLog);
            this.wrapper.find('tbody').append($.parseHTML(html));
            this.updateTotalWeightLifted();
        },

        loadRepLogs: function(){
            let self = this;
            $.ajax({
                url: Routing.generate('rep_log_list'),
                success: function(data) {
                    $.each(data.items, function (key, repLog) {
                        self._addRow(repLog);
                    });
                }
            });
        }

    });

    let Helper = function (wrapper) {
        this.wrapper = wrapper;
    };

    $.extend(Helper.prototype, {
        calculateTotalWeight: function () {
            let totalWeight = 0;
            this.wrapper.find('tbody tr').each(function () {
                totalWeight += $(this).data('weight');
            });

            return totalWeight;
        },
    });

})(window, jQuery);