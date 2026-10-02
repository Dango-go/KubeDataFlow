resource "azurerm_linux_virtual_machine" "vm" {
  name                = "${var.prefix}-medium-vm"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  size                = "Standard_B2s"  
  admin_username      = "admin_az"

  network_interface_ids = [
    azurerm_network_interface.nic.id,
  ]

  admin_ssh_key {
    username   = "admin_az"
    public_key = file("~/.ssh/azure/development/id_rsa.pub")
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }
}


output "public_ip_address" {
  value       = azurerm_public_ip.pip.ip_address
  description = "The public IP address of the medium instance"
}