class Portal::DesignmockController < PortalController

# WARNING: modifying this file is not recommended unless you are familiar with
# developing for the Ruby on Rails web application framework!
#
# This class inherits the default portal's action methods from PortalController.
# Methods defined here will be available as custom actions of this custom portal
# controller.

before_action :get_color_accessibility

def get_color_accessibility
  session[:color_accessibility] = params[:color_accessibility] if params.key?(:color_accessibility)
end

end

